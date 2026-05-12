from app.models.schemas import RecommendRequest


def build_meal_prompt(request: RecommendRequest) -> str:
    ingredients_text = ", ".join(request.ingredients) if request.ingredients else "없음"
    situation = request.situation or "특별한 상황 없음"
    mood = request.mood or "특별한 기분 없음"

    prompt = f"""
너는 사용자의 냉장고 재료와 현재 상황을 바탕으로 음식을 추천하는 AI야.

사용자 입력:
- 보유 재료: {ingredients_text}
- 현재 상황: {situation}
- 현재 기분: {mood}
- 요청 내용: {request.user_message}

응답 조건:
1. 한국어로 답변해.
2. 사용자가 가진 재료를 최대한 활용해.
3. 너무 복잡한 요리는 피하고 현실적인 메뉴를 피하고 현실적인 메뉴를 추천해.
4. 가능하면 2~3개의 메뉴를 추천해.
5. 각 메뉴마다 추천 이유와 간단한 조리 방법을 포함해.
6. 재료가 부족하면 대체 재료도 제안해.

응답 형식:
[추천 메뉴]
1.
2.
3.

[추천 이유]

[간단 조리 방법]

[대체 재료 또는 추가 팁]
"""
    return prompt.strip()