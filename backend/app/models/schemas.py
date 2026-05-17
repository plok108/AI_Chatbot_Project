from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class RecommendRequest(BaseModel):
    ingredients: list[str] = Field(default_factory=list)
    situation: Optional[str] = None
    mood: Optional[str] = None
    user_message: str


class RecommendResponse(BaseModel):
    id: Optional[int] = None
    recommendation: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    nickname: str = Field(min_length=2, max_length=30)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    nickname: str