import hashlib
import secrets
from typing import Optional

from psycopg import connect
from psycopg.errors import UniqueViolation
from psycopg.types.json import Jsonb

from app.config import DATABASE_URL


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")

    return connect(DATABASE_URL)


def init_db():
    if not DATABASE_URL:
        print("[WARN] DATABASE_URL is empty. DB initialization skipped.")
        return

    create_table_sql = """
    CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(128) NOT NULL,
        nickname VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chat_logs (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT REFERENCES users(id),
        conversation_id BIGINT,
        role VARCHAR(20) NOT NULL,
        ingredients JSONB DEFAULT '[]'::jsonb,
        message TEXT NOT NULL,
        recommendation_style VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(create_table_sql)
        conn.commit()

    print("[INFO] Database initialized successfully.")


def create_user(email: str, password_hash: str, nickname: str) -> int:
    insert_sql = """
    INSERT INTO users (email, password_hash, nickname)
    VALUES (%s, %s, %s)
    RETURNING id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(insert_sql, (email, password_hash, nickname))
            row = cur.fetchone()
        conn.commit()

    return row[0]


def get_user_by_email(email: str) -> Optional[dict[str, str | int]]:
    select_sql = """
    SELECT id, email, password_hash, nickname
    FROM users
    WHERE email = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(select_sql, (email,))
            row = cur.fetchone()

    if not row:
        return None

    return {
        "id": row[0],
        "email": row[1],
        "password_hash": row[2],
        "nickname": row[3],
    }


def delete_chat_logs_by_user_id(user_id: int) -> int:
    delete_sql = """
    DELETE FROM chat_logs
    WHERE user_id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(delete_sql, (user_id,))
            deleted = cur.rowcount
        conn.commit()

    return deleted


def delete_user_by_email(email: str) -> bool:
    user = get_user_by_email(email)
    if not user:
        return False

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM chat_logs WHERE user_id = %s;", (user["id"],))
            cur.execute("DELETE FROM users WHERE email = %s;", (email,))
            deleted = cur.rowcount
        conn.commit()

    return deleted > 0


def save_chat_log(
    ingredients: list[str],
    situation: str | None,
    mood: str | None,
    user_message: str,
    ai_response: str,
    user_id: Optional[int] = None,
    conversation_id: Optional[int] = None,
):
    if not DATABASE_URL:
        print("[WARN] DATABASE_URL is empty. Chat log not saved.")
        return None

    # situation과 mood는 별도 컬럼이 없으므로 메타 문자열로 저장합니다.
    recommendation_style = f"situation={situation or ''}; mood={mood or ''}"

    insert_sql = """
    INSERT INTO chat_logs (
        user_id,
        conversation_id,
        role,
        ingredients,
        message,
        recommendation_style
    )
    VALUES (%s, %s, %s, %s, %s, %s)
    RETURNING id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            # 1. 사용자 메시지 저장
            cur.execute(
                insert_sql,
                (
                    user_id,
                    conversation_id,
                    "user",
                    Jsonb(ingredients),
                    user_message,
                    recommendation_style,
                ),
            )

            # 2. AI 응답 저장
            cur.execute(
                insert_sql,
                (
                    user_id,
                    conversation_id,
                    "assistant",
                    Jsonb(ingredients),
                    ai_response,
                    recommendation_style,
                ),
            )

            row = cur.fetchone()

        conn.commit()

    # 마지막으로 저장된 assistant 메시지 id 반환
    return row[0] if row else None