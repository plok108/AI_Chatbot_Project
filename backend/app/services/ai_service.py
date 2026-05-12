from openai import OpenAI

from app.config import OPENAI_API_KEY, OPENAI_MODEL


def get_ai_recommendation(prompt: str) -> str:
    # 아직 API 키 없을 때 테스트용
    if not OPENAI_API_KEY:
        return (
            "OPENAI_API_KEY가 아직 설정되지 않았습니다. "
            "백엔드 연결은 정상입니다."
        )

    client = OpenAI(api_key=OPENAI_API_KEY)

    response = client.responses.create(
        model=OPENAI_MODEL,
        input=prompt,
    )

    return response.output_text