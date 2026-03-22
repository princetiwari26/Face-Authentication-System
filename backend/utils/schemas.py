from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import re


class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    face_image: str           # base-64 encoded image

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain a digit")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class FaceLoginRequest(BaseModel):
    frames: list[str]         # list of base-64 frames for liveness analysis
    face_image: str           # final clean frame for identity matching


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    has_face: bool

    class Config:
        from_attributes = True


class LivenessCheckRequest(BaseModel):
    frames: list[str]


class LivenessCheckResponse(BaseModel):
    blink_detected: bool
    head_movement: bool
    texture_ok: bool
    face_detected: bool
    is_live: bool
    details: dict
