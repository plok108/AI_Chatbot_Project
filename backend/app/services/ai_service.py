import json

from openai import OpenAI

from app.config import OPENAI_API_KEY, OPENAI_MODEL


def get_ai_recommendation(prompt: str) -> str:
    """기존 텍스트 응답 AI 호출 (레시피 생성 등에 사용)."""
    if not OPENAI_API_KEY:
        return (
            "OPENAI_API_KEY가 아직 설정되지 않았습니다. "
            "백엔드 연결은 정상입니다."
        )

    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {
                "role": "system",
                "content": "너는 사용자의 냉장고 재료와 현재 상황을 바탕으로 음식을 추천해주는 AI 셰프야. 항상 한국어로 친절하게 답변해.",
            },
            {"role": "user", "content": prompt},
        ],
    )
    return response.choices[0].message.content


def get_menu_candidates(prompt: str) -> dict:
    """JSON 모드로 메뉴 후보 목록을 반환 (추천 단계)."""
    if not OPENAI_API_KEY:
        return {
            "candidates": [
                {
                    "name": "테스트 메뉴 (API 키 없음)",
                    "reason": "OPENAI_API_KEY가 설정되지 않아 테스트 데이터를 반환합니다.",
                    "usage_rate": 100,
                    "missing_ingredients": [],
                    "extra_cost": 0,
                }
            ],
            "summary": "API 키를 설정하면 실제 추천이 제공됩니다.",
        }

    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": "너는 음식 추천 AI 셰프야. 반드시 유효한 JSON 형식으로만 응답해. 레시피는 포함하지 마.",
            },
            {"role": "user", "content": prompt},
        ],
    )

    try:
        return json.loads(response.choices[0].message.content)
    except (json.JSONDecodeError, KeyError):
        return {"candidates": [], "summary": "응답 파싱에 실패했습니다. 다시 시도해 주세요."}
