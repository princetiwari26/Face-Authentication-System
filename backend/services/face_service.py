"""
Face recognition service.

Handles:
  - Encoding extraction from uploaded images
  - Identity matching against stored encodings
  - Liveness checks (eye blink, head movement, texture analysis)
"""

import json
import base64
import logging
from io import BytesIO
from typing import Optional, Tuple

import cv2
import numpy as np
import face_recognition
import mediapipe as mp
from PIL import Image

logger = logging.getLogger(__name__)

# MediaPipe face-mesh for landmark-based liveness
mp_face_mesh = mp.solutions.face_mesh

# ── Landmark indices (MediaPipe 468-point mesh) ───────────────────────────────
# Left eye  – outer corners + upper/lower lids
LEFT_EYE_INDICES  = [362, 385, 387, 263, 373, 380]
# Right eye – outer corners + upper/lower lids
RIGHT_EYE_INDICES = [33,  160, 158,  133, 153, 144]

FACE_MATCH_TOLERANCE = 0.5   # lower = stricter; 0.6 is library default
EAR_BLINK_THRESHOLD  = 0.22  # Eye Aspect Ratio below this → eye closed
MIN_TEXTURE_VARIANCE = 50    # very flat texture → likely a photo print


# ── Internal helpers ──────────────────────────────────────────────────────────

def _b64_to_ndarray(b64_str: str) -> np.ndarray:
    """Decode a base-64 image string to an RGB numpy array."""
    b64_str = b64_str.split(",")[-1]          # strip data-URI prefix if present
    img_bytes = base64.b64decode(b64_str)
    pil_img   = Image.open(BytesIO(img_bytes)).convert("RGB")
    return np.array(pil_img)


def _eye_aspect_ratio(landmarks, eye_indices: list, img_w: int, img_h: int) -> float:
    """Compute Eye Aspect Ratio (EAR) from MediaPipe landmarks."""
    pts = []
    for idx in eye_indices:
        lm = landmarks[idx]
        pts.append((lm.x * img_w, lm.y * img_h))

    # Vertical distances (p2-p6, p3-p5)
    A = np.linalg.norm(np.array(pts[1]) - np.array(pts[5]))
    B = np.linalg.norm(np.array(pts[2]) - np.array(pts[4]))
    # Horizontal distance (p1-p4)
    C = np.linalg.norm(np.array(pts[0]) - np.array(pts[3]))
    return (A + B) / (2.0 * C + 1e-6)


def _texture_variance(gray: np.ndarray) -> float:
    """Laplacian variance – very low values indicate a flat/printed photo."""
    return cv2.Laplacian(gray, cv2.CV_64F).var()


# ── Public API ────────────────────────────────────────────────────────────────

def extract_face_encoding(image_b64: str) -> Optional[list]:
    """
    Extract a 128-dimensional face encoding from a base-64 image.
    Returns None when no face is detected.
    """
    try:
        rgb = _b64_to_ndarray(image_b64)
        locations = face_recognition.face_locations(rgb, model="hog")
        if not locations:
            return None
        encodings = face_recognition.face_encodings(rgb, locations)
        if not encodings:
            return None
        return encodings[0].tolist()
    except Exception as exc:
        logger.error("extract_face_encoding error: %s", exc)
        return None


def match_face_against_users(
    probe_b64: str,
    user_encodings: list[Tuple[int, str]],   # [(user_id, json_encoding), ...]
) -> Optional[Tuple[int, float]]:
    """
    Compare probe image against every stored encoding.

    Returns (user_id, distance) for the best match below tolerance,
    or None if no match found.
    """
    try:
        rgb = _b64_to_ndarray(probe_b64)
        locations = face_recognition.face_locations(rgb, model="hog")
        if not locations:
            return None
        probe_enc = face_recognition.face_encodings(rgb, locations)
        if not probe_enc:
            return None
        probe_enc = probe_enc[0]

        best_id   = None
        best_dist = float("inf")

        for uid, enc_json in user_encodings:
            stored = np.array(json.loads(enc_json))
            dist   = face_recognition.face_distance([stored], probe_enc)[0]
            if dist < FACE_MATCH_TOLERANCE and dist < best_dist:
                best_dist = dist
                best_id   = uid

        if best_id is not None:
            return (best_id, float(best_dist))
        return None

    except Exception as exc:
        logger.error("match_face_against_users error: %s", exc)
        return None


def analyze_liveness_frames(frames_b64: list[str]) -> dict:
    """
    Analyze a sequence of frames for liveness signals.

    Checks:
      1. Eye blink (EAR drops below threshold at least once)
      2. Head movement  (nose-tip centroid shifts across frames)
      3. Texture (Laplacian variance – rejects printed photos)
      4. Face presence  (at least one face detected in majority of frames)

    Returns a dict with per-check booleans and an overall `is_live` flag.
    """
    result = {
        "blink_detected":    False,
        "head_movement":     False,
        "texture_ok":        False,
        "face_detected":     False,
        "is_live":           False,
        "details":           {}
    }

    if not frames_b64:
        result["details"]["error"] = "No frames provided"
        return result

    ear_values    = []
    nose_positions = []
    texture_scores = []
    face_count     = 0

    with mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
    ) as face_mesh:

        for frame_b64 in frames_b64:
            try:
                rgb  = _b64_to_ndarray(frame_b64)
                gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
                h, w = rgb.shape[:2]

                # Texture check
                texture_scores.append(_texture_variance(gray))

                mp_result = face_mesh.process(rgb)
                if not mp_result.multi_face_landmarks:
                    continue

                face_count += 1
                lms = mp_result.multi_face_landmarks[0].landmark

                # EAR for both eyes
                left_ear  = _eye_aspect_ratio(lms, LEFT_EYE_INDICES,  w, h)
                right_ear = _eye_aspect_ratio(lms, RIGHT_EYE_INDICES, w, h)
                ear_values.append((left_ear + right_ear) / 2.0)

                # Nose tip (landmark 1) for head-movement tracking
                nose = lms[1]
                nose_positions.append((nose.x * w, nose.y * h))

            except Exception as exc:
                logger.warning("Frame analysis error: %s", exc)

    total_frames = len(frames_b64)

    # ── Face presence ─────────────────────────────────────────────────────────
    result["face_detected"] = face_count >= max(1, total_frames * 0.5)

    # ── Blink detection ───────────────────────────────────────────────────────
    if ear_values:
        min_ear = min(ear_values)
        max_ear = max(ear_values)
        # A genuine blink shows EAR drop AND at least some open-eye frames
        result["blink_detected"] = (
            min_ear < EAR_BLINK_THRESHOLD and max_ear > EAR_BLINK_THRESHOLD + 0.05
        )
        result["details"]["ear_min"] = round(min_ear, 3)
        result["details"]["ear_max"] = round(max_ear, 3)

    # ── Head movement ─────────────────────────────────────────────────────────
    if len(nose_positions) >= 2:
        xs = [p[0] for p in nose_positions]
        ys = [p[1] for p in nose_positions]
        movement = ((max(xs) - min(xs)) ** 2 + (max(ys) - min(ys)) ** 2) ** 0.5
        result["head_movement"] = movement > 8   # pixels
        result["details"]["head_movement_px"] = round(movement, 1)

    # ── Texture ───────────────────────────────────────────────────────────────
    if texture_scores:
        avg_texture = float(np.mean(texture_scores))
        result["texture_ok"] = avg_texture > MIN_TEXTURE_VARIANCE
        result["details"]["texture_variance"] = round(avg_texture, 1)

    # ── Overall liveness ──────────────────────────────────────────────────────
    result["is_live"] = (
        result["face_detected"]
        and result["blink_detected"]
        and result["texture_ok"]
    )

    return result
