from typing import Optional

from pydantic import BaseModel, Field


class RecommendRequest(BaseModel):
    ingredients: list[str] = Field(default_factory=list)
    situation: Optional[str] = None
    mood: Optional[str] = None
    user_message: str


class RecommendResponse(BaseModel):
    id: Optional[int] = None
    recommendation: str