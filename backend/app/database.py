import psycopg
from psycopg.types.json import Jsonb

from app.config import DATABASE_URL


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")

    return psycopg.connect(DATABASE_URL)


def init_db():
    if not DATABASE_URL:
        print("[WARN] DATABASE_URL is empty. DB initialization skipped.")
        return

    create_table_sql = """
    CREATE TABLE IF NOT EXISTS chat_logs (
        id BIGSERIAL PRIMARY KEY,
        ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
        situation TEXT,
        mood TEXT,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(create_table_sql)
        conn.commit()

    print("[INFO] Database initialized successfully.")


def save_chat_log(
    ingredients: list[str],
    situation: str | None,
    mood: str | None,
    user_message: str,
    ai_response: str,
):
    if not DATABASE_URL:
        print("[WARN] DATABASE_URL is empty. Chat log not saved.")
        return None

    insert_sql = """
    INSERT INTO chat_logs (
        ingredients,
        situation,
        mood,
        user_message,
        ai_response
    )
    VALUES (%s, %s, %s, %s, %s)
    RETURNING id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                insert_sql,
                (
                    Jsonb(ingredients),
                    situation,
                    mood,
                    user_message,
                    ai_response,
                ),
            )
            row = cur.fetchone()
        conn.commit()

    return row[0] if row else None