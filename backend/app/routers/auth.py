from psycopg.errors import UniqueViolation
from fastapi import APIRouter, HTTPException

from app.models.schemas import AuthResponse, LoginRequest, RegisterRequest
from app.services.auth_service import authenticate_user, delete_user, register_user
from app.services.token_service import create_access_token

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
def register_user_endpoint(request: RegisterRequest):
    try:
        user_id = register_user(
            email=request.email,
            password=request.password,
            nickname=request.nickname,
        )
    except UniqueViolation:
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"회원가입 처리 중 오류가 발생했습니다: {exc}")

    return AuthResponse(
        id=user_id,
        email=request.email,
        nickname=request.nickname,
        access_token=create_access_token(user_id),
    )


@router.post("/login", response_model=AuthResponse)
def login_user_endpoint(request: LoginRequest):
    user = authenticate_user(request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    return AuthResponse(
        id=user["id"],
        email=user["email"],
        nickname=user["nickname"],
        access_token=create_access_token(user["id"]),
    )


@router.post("/delete")
def delete_user_endpoint(request: LoginRequest):
    if not delete_user(request.email, request.password):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    return {"detail": "회원 탈퇴가 완료되었습니다."}
