"""상황 인식.

사용자가 입력하지 않아도 '현재 시간대'와(직접 고르면) '현재 날씨'를 파악해
추천 프롬프트와 재정렬 점수에 반영한다.

- 시간대: 디바이스(브라우저)가 보내준 시각 우선, 없으면 서버 시각
- 날씨: 사용자 수동 입력 우선 → 없으면(키 있을 때) 무료 API → 둘 다 없으면 시간대만
"""

import json
import urllib.parse
import urllib.request
from datetime import datetime

from app.config import WEATHER_API_KEY, WEATHER_CITY

# ── 시간대 구분 경계 (24시간제) ────────────────────────────────
MORNING_START = 5      # 05~10시: 아침
LUNCH_START = 11       # 11~13시: 점심
AFTERNOON_START = 14   # 14~16시: 오후
EVENING_START = 17     # 17~21시: 저녁
NIGHT_START = 22       # 22~04시: 야식 시간대

# ── 날씨 판정 기준 ─────────────────────────────────────────────
COLD_TEMP_C = 12       # 이 온도 이하면 '추움'
HOT_TEMP_C = 28        # 이 온도 이상이면 '더움'
RAINY_CONDITIONS = {"rain", "drizzle", "thunderstorm", "snow"}  # 비/눈으로 취급

# ── OpenWeather API 설정 ──────────────────────────────────────
WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather"
WEATHER_TIMEOUT_SEC = 3

# 사용자가 고르는 체감 온도 → 한국어 라벨
WEATHER_FEEL_LABELS = {"cold": "추움", "normal": "보통", "hot": "더움"}


def _time_of_day(hour: int) -> tuple[str, str]:
    """시각(0~23)을 (코드, 한국어 라벨)로 변환."""
    if MORNING_START <= hour < LUNCH_START:
        return "morning", "아침"
    if LUNCH_START <= hour < AFTERNOON_START:
        return "lunch", "점심"
    if AFTERNOON_START <= hour < EVENING_START:
        return "afternoon", "오후"
    if EVENING_START <= hour < NIGHT_START:
        return "evening", "저녁"
    return "late_night", "야식 시간대"


def _manual_weather(weather_feel: str | None, weather_wet: bool | None) -> dict | None:
    """사용자가 직접 고른 날씨를 weather dict로 변환."""
    if not weather_feel and not weather_wet:
        return None

    feel = (weather_feel or "").strip().lower()
    label = WEATHER_FEEL_LABELS.get(feel, "")
    if weather_wet:
        label = (label + " / 비·눈").strip(" /")

    return {
        "is_cold": feel == "cold",
        "is_hot": feel == "hot",
        "is_rainy": bool(weather_wet),
        "description": label,
        "source": "manual",
    }


def _fetch_weather(city: str) -> dict | None:
    """OpenWeather 현재 날씨 조회. 키가 없거나 실패하면 None."""
    if not WEATHER_API_KEY:
        return None
    try:
        params = urllib.parse.urlencode({
            "q": city,
            "appid": WEATHER_API_KEY,
            "units": "metric",
            "lang": "kr",
        })
        with urllib.request.urlopen(f"{WEATHER_API_URL}?{params}", timeout=WEATHER_TIMEOUT_SEC) as resp:
            data = json.loads(resp.read())
        temp = float(data["main"]["temp"])
        condition = data["weather"][0]["main"].lower()  # rain, clear, snow ...
        return {
            "temp": temp,
            "condition": condition,
            "description": data["weather"][0].get("description", ""),
            "is_cold": temp <= COLD_TEMP_C,
            "is_hot": temp >= HOT_TEMP_C,
            "is_rainy": condition in RAINY_CONDITIONS,
            "source": "api",
        }
    except Exception:
        # 네트워크/키/응답 오류 시 날씨 없이 진행(데모 안전)
        return None


def get_context(
    hour: int | None = None,
    weather_feel: str | None = None,
    weather_wet: bool | None = None,
    city: str | None = None,
) -> dict:
    """현재 상황(시간대 + 선택적 날씨)을 구조화해 반환."""
    use_hour = hour if hour is not None else datetime.now().hour
    time_code, time_label = _time_of_day(use_hour)

    weather = _manual_weather(weather_feel, weather_wet)
    if weather is None:
        weather = _fetch_weather(city or WEATHER_CITY)  # 키 없으면 None

    # 프롬프트에 넣을, 사람이 읽는 문장
    text_parts = [f"현재 {time_label}({use_hour}시)"]
    if weather:
        if weather.get("temp") is not None:
            text_parts.append(f"{round(weather['temp'])}℃")
        text_parts.append(weather.get("description") or weather.get("condition", ""))
    text = ", ".join(part for part in text_parts if part)

    return {
        "hour": use_hour,
        "time_of_day": time_code,
        "time_label": time_label,
        "weather": weather,        # None 가능
        "text": text,
    }
