import hashlib
import hmac
import secrets
from typing import Optional

from app.database import create_user, delete_user_by_email, get_user_by_email


def generate_password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        200_000,
        dklen=32,
    )
    return f"{salt}${key.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt, stored_hash = password_hash.split("$", 1)
    except ValueError:
        return False

    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        200_000,
        dklen=32,
    )
    return hmac.compare_digest(stored_hash, key.hex())


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
