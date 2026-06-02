from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class RecommendRequest(BaseModel):
    # user_id는 더 이상 신뢰하지 않는다(JWT 토큰에서 추출). 하위호환을 위해 필드는 유지.
    user_id: Optional[int] = None
    ingredients: list[str] = Field(default_factory=list)
    situation: Optional[str] = Field(default=None, max_length=200)
    mood: Optional[str] = Field(default=None, max_length=200)
    user_message: str = Field(max_length=2000)
    disliked_foods: list[str] = Field(default_factory=list)
    # 디바이스(브라우저) 로컬 시각 0~23. 없으면 서버 시각으로 폴백.
    client_hour: Optional[int] = Field(default=None, ge=0, le=23)
    # 사용자가 직접 고른 날씨. cold/normal/hot, 비·눈 여부.
    weather_feel: Optional[str] = Field(default=None, max_length=10)
    weather_wet: Optional[bool] = None


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


class AuthResponse(BaseModel):
    """로그인/회원가입 성공 응답 — 사용자 정보 + JWT 액세스 토큰."""
    id: int
    email: EmailStr
    nickname: str
    access_token: str
    token_type: str = "bearer"


class IngredientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class IngredientItem(BaseModel):
    id: int
    user_id: int
    name: str
    date: str


# ── 메뉴 추천 단계 ──────────────────────────────────────────

class MissingIngredient(BaseModel):
    name: str
    cost: int


class MenuCandidate(BaseModel):
    name: str
    reason: str
    usage_rate: int
    missing_ingredients: list[MissingIngredient] = Field(default_factory=list)
    extra_cost: int
    # GPT가 펼친 전체 재료(양념 포함) — 안전 검사 및 화면 표시용
    ingredients: list[str] = Field(default_factory=list)
    # 재료 검증 불가 등으로 사용자 확인이 필요한 경우의 경고 문구
    safety_note: Optional[str] = None


class MenuRecommendResponse(BaseModel):
    conversation_id: int
    candidates: list[MenuCandidate]
    summary: Optional[str] = None


# ── 메뉴 선택 및 레시피 단계 ────────────────────────────────

class SelectMenuRequest(BaseModel):
    user_id: Optional[int] = None
    food_name: str = Field(max_length=100)
    conversation_id: Optional[int] = None


class RecipeRequest(BaseModel):
    user_id: Optional[int] = None
    food_name: str = Field(max_length=100)
    conversation_id: Optional[int] = None
    ingredients: list[str] = Field(default_factory=list)


class RecipeResponse(BaseModel):
    food_name: str
    recipe: str
