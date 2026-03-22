from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from database import get_db
from models.user import User
from utils.schemas import (
    FaceLoginRequest, TokenResponse,
    LivenessCheckRequest, LivenessCheckResponse,
)
from utils.security import create_access_token
from services.face_service import analyze_liveness_frames, match_face_against_users

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/liveness-check", response_model=LivenessCheckResponse)
@limiter.limit("20/minute")
async def liveness_check(
    request: Request,
    payload: LivenessCheckRequest,
    db: Session = Depends(get_db),
):
    """
    Intermediate liveness check during the face-capture flow.
    Frontend can call this to give real-time feedback before submitting the
    full face-login request.
    """
    if len(payload.frames) < 5:
        raise HTTPException(status_code=400, detail="At least 5 frames required for liveness analysis")
    if len(payload.frames) > 60:
        raise HTTPException(status_code=400, detail="Too many frames (max 60)")

    result = analyze_liveness_frames(payload.frames)
    return LivenessCheckResponse(**result)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("8/minute")
async def face_login(
    request: Request,
    payload: FaceLoginRequest,
    db: Session = Depends(get_db),
):
    """
    Face-only login flow:
    1. Liveness analysis on the submitted frame sequence
    2. Identity match against all registered face encodings
    3. Return JWT token with user info (no email/password needed)
    """

    # ── Step 1: Liveness ──────────────────────────────────────────────────────
    if len(payload.frames) < 5:
        raise HTTPException(status_code=400, detail="At least 5 frames required for liveness analysis")

    liveness = analyze_liveness_frames(payload.frames)

    if not liveness["face_detected"]:
        raise HTTPException(
            status_code=400,
            detail="No face detected in frames. Please ensure good lighting and face the camera."
        )

    if not liveness["blink_detected"]:
        raise HTTPException(
            status_code=401,
            detail="Liveness check failed: no eye blink detected. Please blink naturally."
        )

    if not liveness["texture_ok"]:
        raise HTTPException(
            status_code=401,
            detail="Liveness check failed: image appears to be a photograph. Please use a live camera."
        )

    # ── Step 2: Identity matching ─────────────────────────────────────────────
    users_with_faces = (
        db.query(User)
        .filter(User.face_encoding.isnot(None), User.is_active == True)
        .all()
    )

    if not users_with_faces:
        raise HTTPException(status_code=404, detail="No registered faces found")

    user_encodings = [(u.id, u.face_encoding) for u in users_with_faces]
    match = match_face_against_users(payload.face_image, user_encodings)

    if match is None:
        raise HTTPException(
            status_code=401,
            detail="Face not recognised. This face is not registered in the system."
        )

    matched_user_id, distance = match
    matched_user = db.query(User).filter(User.id == matched_user_id).first()

    if not matched_user or not matched_user.is_active:
        raise HTTPException(status_code=401, detail="Matched user account is inactive")

    # ── Step 3: Issue token ───────────────────────────────────────────────────
    token = create_access_token({"sub": str(matched_user.id)})

    return TokenResponse(
        access_token=token,
        user_id=matched_user.id,
        name=matched_user.name,
        email=matched_user.email,
    )
