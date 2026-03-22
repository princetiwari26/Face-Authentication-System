from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from database import get_db
from models.user import User
from utils.schemas import UserSignup, UserLogin, TokenResponse, UserResponse
from utils.security import hash_password, verify_password, create_access_token
from utils.dependencies import get_current_user
from services.face_service import extract_face_encoding
import json

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def signup(request: Request, payload: UserSignup, db: Session = Depends(get_db)):
    # Check duplicate email
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Extract face encoding
    encoding = extract_face_encoding(payload.face_image)
    if encoding is None:
        raise HTTPException(
            status_code=400,
            detail="No face detected in the image. Please take a clear selfie."
        )

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        face_encoding=json.dumps(encoding),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        has_face=True,
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        name=user.name,
        email=user.email,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        has_face=current_user.face_encoding is not None,
    )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    # JWT is stateless; client simply discards the token
    return {"message": "Logged out successfully"}
