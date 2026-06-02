"""인증 관련 FastAPI 의존성.

요청 헤더의 `Authorization: Bearer <token>`에서 user_id를 추출한다.
클라이언트가 보낸 user_id를 신뢰하지 않고, 토큰에서만 신원을 확인한다.
"""

from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.token_service import decode_access_token

# auto_error=False → 토큰이 없어도 예외를 던지지 않음(게스트 허용 엔드포인트용)
_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> int:
    """로그인 필수 엔드포인트용. 유효한 토큰이 없으면 401."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(status_code=401, detail="유효하지 않거나 만료된 토큰입니다.")

    return user_id


def get_optional_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> Optional[int]:
    """게스트도 허용하는 엔드포인트용. 토큰이 없거나 무효하면 None(게스트)."""
    if credentials is None:
        return None

    return decode_access_token(credentials.credentials)
