from app.models.schemas import RecommendRequest


# ── 추천 단계 전용 (JSON 응답) ────────────────────────────────

def build_menu_recommendation_prompt(
    request: RecommendRequest,
    preferences_text: str = "",
    context_text: str = "",
) -> str:
    """메뉴 후보만 반환하는 JSON 프롬프트 (레시피 미포함)."""
    ingredients_text = ", ".join(request.ingredients) if request.ingredients else "없음"
    situation = request.situation or "특별한 상황 없음"
    mood = request.mood or "특별한 기분 없음"
    disliked_text = ", ".join(request.disliked_foods) if request.disliked_foods else None

    disliked_block = (
        f"\n기피 음식·알러지 (절대 포함 금지): {disliked_text}"
    ) if disliked_text else ""

    pref_block = (
        f"\n[사용자 선호 정보]\n{preferences_text}"
    ) if preferences_text else ""

    context_block = (
        f"\n[자동 감지된 현재 상황]\n{context_text}\n이 시간대·날씨에 어울리는 메뉴를 우선 고려해."
    ) if context_text else ""

    return f"""너는 사용자의 냉장고 재료를 분석해 메뉴 후보를 추천하는 AI 셰프야.
반드시 아래 JSON 형식으로만 응답해. 레시피와 조리 방법은 절대 포함하지 마.

사용자 정보:
- 보유 재료: {ingredients_text}
- 현재 상황: {situation}
- 현재 기분: {mood}
- 요청 내용: {request.user_message}{disliked_block}{pref_block}{context_block}

JSON 응답 형식:
{{
  "candidates": [
    {{
      "name": "음식명",
      "reason": "이 메뉴를 추천하는 이유 (1~2문장, 보유 재료·상황·기분 연관)",
      "usage_rate": 보유재료_활용률_정수(0~100),
      "ingredients": ["이 메뉴에 들어가는 모든 재료 (주재료·부재료·양념·젓갈까지 빠짐없이)"],
      "missing_ingredients": [
        {{"name": "부족한재료명", "cost": 한국마트기준_소포장가격_정수(원)}}
      ],
      "extra_cost": 총_추가비용_정수(원)
    }}
  ],
  "summary": "전체 추천 상황 요약 (1~2문장)"
}}

규칙:
1. candidates 2~3개, 보유재료 활용률 높은 순서로 정렬
2. 기피 음식이 있으면 해당 재료가 포함된 메뉴는 절대 제외
3. missing_ingredients가 없으면 빈 배열 []
4. extra_cost · cost 는 원 단위 정수 (예: 2000)
5. usage_rate 는 0~100 정수
6. ingredients에는 새우젓·액젓·굴소스·다시다 같은 숨은 양념과 알러지원까지 반드시 포함해라""".strip()


# ── 레시피 단계 전용 ─────────────────────────────────────────

def build_recipe_prompt(food_name: str, ingredients: list[str]) -> str:
    """선택된 메뉴의 '자세한' 레시피를 생성하는 프롬프트."""
    ingredients_text = ", ".join(ingredients) if ingredients else "없음"
    return f"""사용자가 "{food_name}"를 선택했습니다.
현재 보유 재료: {ingredients_text}

요리 초보자도 그대로 따라 하면 성공할 수 있도록, "{food_name}"의 **아주 자세한** 레시피를
한국어로 친절하게 작성해줘. 보유 재료를 최대한 활용하고, 부족한 재료는 대체 방법도 알려줘.

아래 형식을 빠짐없이 지켜서 답변해:

[기본 정보]
- 분량: X인분
- 난이도: 쉬움/보통/어려움
- 총 소요 시간: 약 X분 (준비 X분 + 조리 X분)

[재료와 정확한 분량]
- 보유 재료: 이름과 분량 (예: 달걀 2개, 대파 1/2대)
- 추가 필요 재료: 이름과 분량, 없으면 대체 재료 제안
- 양념: 정확한 계량 (예: 간장 1큰술, 설탕 1작은술)

[사전 준비]
재료 손질·계량 등 조리 전에 해둘 일을 순서대로

[조리 순서]
1. 각 단계를 잘게 나눠서 설명. 각 단계마다 불 세기(센불/중불/약불)와 시간을 함께 표기
2. (예: 중불에서 2분간 볶는다)
3. ...

[맛 조절 팁]
간 맞추기, 더 맛있게 만드는 요령

[자주 하는 실수]
초보자가 실패하기 쉬운 부분과 해결법 1~2가지

[플레이팅 & 보관]
담음새 팁과, 남았을 때 보관 방법""".strip()
