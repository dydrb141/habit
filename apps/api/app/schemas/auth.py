"""Authentication request/response schemas."""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID

from app.models.user import UserRole


class UserRegister(BaseModel):
    """User registration request."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    nickname: str = Field(min_length=2, max_length=20)
    role: UserRole


class UserLogin(BaseModel):
    """User login request."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    """User information response."""
    id: UUID
    email: str
    nickname: str
    role: UserRole
    created_at: datetime

    model_config = {"from_attributes": True}


class PairingCodeRequest(BaseModel):
    """Generate pairing code request."""
    child_nickname: str = Field(min_length=2, max_length=20)


class PairingCodeResponse(BaseModel):
    """Pairing code response."""
    code: str
    expires_in_minutes: int = 60


class PairWithCodeRequest(BaseModel):
    """Pair with code request."""
    pairing_code: str = Field(min_length=6, max_length=6)
