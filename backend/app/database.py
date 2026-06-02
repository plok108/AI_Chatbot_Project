import time
from typing import Optional

from psycopg import connect
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

    CREATE TABLE IF NOT EXISTS user_ingredients (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_disliked_foods (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        food VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, food)
    );

    CREATE TABLE IF NOT EXISTS user_food_history (
        id              BIGSERIAL PRIMARY KEY,
        user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        conversation_id BIGINT,
        food_name       VARCHAR(100) NOT NULL,
        selected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 추천 통계: 추천이 일어날 때의 구조화 기록(어떤 기능이 켜졌는지 + 후보 목록)
    CREATE TABLE IF NOT EXISTS recommendation_events (
        id              BIGSERIAL PRIMARY KEY,
        conversation_id BIGINT,
        user_id         BIGINT,
        enable_safety   BOOLEAN,
        enable_rerank   BOOLEAN,
        enable_context  BOOLEAN,
        disliked_foods  JSONB DEFAULT '[]'::jsonb,
        candidates      JSONB DEFAULT '[]'::jsonb,
        removed_count   INT DEFAULT 0,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    """

    # 기존 DB에 컬럼이 없을 경우를 대비한 안전한 마이그레이션
    alter_sql = """
    ALTER TABLE user_food_history
    ADD COLUMN IF NOT EXISTS conversation_id BIGINT;

    -- 자기서술적 비밀번호 해시 포맷(pbkdf2_sha256$iter$salt$digest)을 담기 위해 확장
    ALTER TABLE users
    ALTER COLUMN password_hash TYPE VARCHAR(255);
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(create_table_sql)
            cur.execute(alter_sql)
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

    if conversation_id is None:
        conversation_id = int(time.time() * 1000)

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

    return row[0] if row else None


def get_chat_history_by_user_id(user_id: int) -> list[dict]:
    if not DATABASE_URL:
        return []

    sql = """
    SELECT
        l1.conversation_id,
        l1.message AS user_message,
        l2.message AS ai_response,
        l1.recommendation_style,
        l1.created_at
    FROM chat_logs l1
    LEFT JOIN chat_logs l2
        ON l1.conversation_id = l2.conversation_id
        AND l2.role = 'assistant'
    WHERE l1.user_id = %s AND l1.role = 'user'
    ORDER BY l1.created_at DESC;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (user_id,))
            rows = cur.fetchall()

    result = []
    for r in rows:
        result.append({
            "conversation_id": r[0],
            "user_message": r[1],
            "ai_response": r[2],
            "recommendation_style": r[3],
            "created_at": r[4].strftime("%Y-%m-%d %H:%M") if r[4] else None,
        })
    return result


def get_ingredients_by_user_id(user_id: int) -> list[dict]:
    if not DATABASE_URL:
        return []

    sql = """
    SELECT id, user_id, name, created_at
    FROM user_ingredients
    WHERE user_id = %s
    ORDER BY created_at DESC;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (user_id,))
            rows = cur.fetchall()

    return [
        {
            "id": r[0],
            "user_id": r[1],
            "name": r[2],
            "date": r[3].strftime("%Y.%m.%d") if r[3] else "",
        }
        for r in rows
    ]


def add_ingredient(user_id: int, name: str) -> int:
    sql = """
    INSERT INTO user_ingredients (user_id, name)
    VALUES (%s, %s)
    RETURNING id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (user_id, name))
            row = cur.fetchone()
        conn.commit()

    return row[0]


def delete_ingredient(ingredient_id: int, user_id: int) -> bool:
    sql = """
    DELETE FROM user_ingredients
    WHERE id = %s AND user_id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (ingredient_id, user_id))
            deleted = cur.rowcount
        conn.commit()

    return deleted > 0


def get_disliked_foods(user_id: int) -> list[str]:
    if not DATABASE_URL:
        return []

    sql = """
    SELECT food FROM user_disliked_foods
    WHERE user_id = %s
    ORDER BY created_at ASC;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (user_id,))
            rows = cur.fetchall()

    return [r[0] for r in rows]


def add_disliked_food(user_id: int, food: str) -> bool:
    sql = """
    INSERT INTO user_disliked_foods (user_id, food)
    VALUES (%s, %s)
    ON CONFLICT (user_id, food) DO NOTHING;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (user_id, food))
        conn.commit()

    return True


def remove_disliked_food(user_id: int, food: str) -> bool:
    sql = """
    DELETE FROM user_disliked_foods
    WHERE user_id = %s AND food = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (user_id, food))
            deleted = cur.rowcount
        conn.commit()

    return deleted > 0


def save_food_history(
    user_id: int,
    food_name: str,
    conversation_id: Optional[int] = None,
) -> int:
    sql = """
    INSERT INTO user_food_history (user_id, conversation_id, food_name)
    VALUES (%s, %s, %s)
    RETURNING id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (user_id, conversation_id, food_name))
            row = cur.fetchone()
        conn.commit()

    return row[0]


def save_recommendation_event(
    conversation_id: int,
    user_id: Optional[int],
    enable_safety: bool,
    enable_rerank: bool,
    enable_context: bool,
    disliked_foods: list[str],
    candidates: list[dict],
    removed_count: int,
) -> Optional[int]:
    """추천 1회의 구조화 기록을 저장한다(통계 계산의 원천 데이터)."""
    if not DATABASE_URL:
        return None

    sql = """
    INSERT INTO recommendation_events (
        conversation_id, user_id,
        enable_safety, enable_rerank, enable_context,
        disliked_foods, candidates, removed_count
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                sql,
                (
                    conversation_id,
                    user_id,
                    enable_safety,
                    enable_rerank,
                    enable_context,
                    Jsonb(disliked_foods),
                    Jsonb(candidates),
                    removed_count,
                ),
            )
            row = cur.fetchone()
        conn.commit()

    return row[0] if row else None


def get_recommendation_events() -> list[dict]:
    """저장된 모든 추천 이벤트를 반환(metrics 집계용)."""
    if not DATABASE_URL:
        return []

    sql = """
    SELECT conversation_id, user_id,
           enable_safety, enable_rerank, enable_context,
           disliked_foods, candidates, removed_count
    FROM recommendation_events;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()

    return [
        {
            "conversation_id": r[0],
            "user_id": r[1],
            "enable_safety": r[2],
            "enable_rerank": r[3],
            "enable_context": r[4],
            "disliked_foods": r[5] or [],
            "candidates": r[6] or [],
            "removed_count": r[7] or 0,
        }
        for r in rows
    ]


def get_selected_conversation_ids() -> set[int]:
    """선택 기록이 있는 conversation_id 집합(추천 수용률 계산용)."""
    if not DATABASE_URL:
        return set()

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT DISTINCT conversation_id FROM user_food_history WHERE conversation_id IS NOT NULL;"
            )
            rows = cur.fetchall()

    return {r[0] for r in rows}


def get_food_history(user_id: int, limit: int = 30) -> list[str]:
    if not DATABASE_URL:
        return []

    sql = """
    SELECT food_name
    FROM user_food_history
    WHERE user_id = %s
    ORDER BY selected_at DESC
    LIMIT %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (user_id, limit))
            rows = cur.fetchall()

    return [r[0] for r in rows]
