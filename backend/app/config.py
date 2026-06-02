import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# JWT 인증 설정
# 운영 환경에서는 반드시 .env의 JWT_SECRET을 강력한 랜덤 값으로 설정할 것
JWT_SECRET = os.getenv("JWT_SECRET", "dev-insecure-secret-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))


def _flag(name: str, default: str = "true") -> bool:
    return os.getenv(name, default).strip().lower() in ("1", "true", "yes", "on")


# ── 추천 파이프라인 기능 스위치 ──────────
# 모두 끄면 GPT 응답만 사용, 모두 켜면 규칙 기반 후처리까지 적용한다.
ENABLE_SAFETY_FILTER = _flag("ENABLE_SAFETY_FILTER")  # 기피/알러지 코드 하드 필터
ENABLE_RERANK = _flag("ENABLE_RERANK")                # 규칙 기반 재정렬
ENABLE_CONTEXT = _flag("ENABLE_CONTEXT")              # 자동 상황(시간/날씨) 인식

# ── 재정렬 점수 가중치 (합이 1.0이 되도록 권장) ────────────────
WEIGHT_USAGE = float(os.getenv("WEIGHT_USAGE", "0.4"))       # 재료 활용률
WEIGHT_PREFERENCE = float(os.getenv("WEIGHT_PREFERENCE", "0.3"))  # 취향 일치
WEIGHT_CONTEXT = float(os.getenv("WEIGHT_CONTEXT", "0.2"))   # 상황 적합도
WEIGHT_COST = float(os.getenv("WEIGHT_COST", "0.1"))         # 비용 효율

# ── 날씨 API (선택) ────────────────────────────────────────────
# 키가 없으면 날씨는 생략되고 '시간대'만 상황 인식에 사용된다(데모 안전).
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "")
WEATHER_CITY = os.getenv("WEATHER_CITY", "Seoul")