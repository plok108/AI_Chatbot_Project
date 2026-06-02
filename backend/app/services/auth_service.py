import hashlib
import hmac
import secrets
from typing import Optional

from app.database import create_user, delete_user_by_email, get_user_by_email

# 반복 횟수를 해시 문자열에 함께 저장하여, 기존 해시를 깨지 않고도
# 향후 비용을 조정할 수 있도록 한다.
_PBKDF2_ITERATIONS = 200_000


def _pbkdf2(password: str, salt: str, iterations: int) -> str:
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
        dklen=32,
    )
    return key.hex()


def generate_password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = _pbkdf2(password, salt, _PBKDF2_ITERATIONS)
    # 자기서술적 포맷: 알고리즘$반복횟수$salt$digest
    return f"pbkdf2_sha256${_PBKDF2_ITERATIONS}${salt}${digest}"


def verify_password(password: str, password_hash: str) -> bool:
    parts = password_hash.split("$")

    if len(parts) == 4:
        # 신규 포맷: pbkdf2_sha256$iterations$salt$digest
        _, iter_str, salt, stored_hash = parts
        try:
            iterations = int(iter_str)
        except ValueError:
            return False
    elif len(parts) == 2:
        # 구버전 포맷(salt$digest)은 항상 200,000회로 생성됨
        salt, stored_hash = parts
        iterations = 200_000
    else:
        return False

    digest = _pbkdf2(password, salt, iterations)
    return hmac.compare_digest(stored_hash, digest)


def register_user(email: str, password: str, nickname: str) -> int:
    password_hash = generate_password_hash(password)
    return create_user(email=email, password_hash=password_hash, nickname=nickname)


def authenticate_user(email: str, password: str) -> Optional[dict[str, str | int]]:
    user = get_user_by_email(email)
    if not user:
        return None

    if not verify_password(password, user["password_hash"]):
        return None

    return user


def delete_user(email: str, password: str) -> bool:
    user = authenticate_user(email, password)
    if not user:
        return False

    return delete_user_by_email(email)
