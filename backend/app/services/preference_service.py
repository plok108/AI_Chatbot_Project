"""사용자 선택 기록 기반 선호도 분석 서비스."""
from collections import defaultdict

FOOD_CATEGORIES: dict[str, list[str]] = {
    "spicy": [
        "제육볶음", "떡볶이", "닭갈비", "부대찌개", "마라탕",
        "불닭볶음면", "낙지볶음", "오삼불고기", "매운갈비찜", "청양",
        "김치찌개", "순대국", "육개장",
    ],
    "soup": [
        "김치찌개", "된장찌개", "순두부찌개", "미역국", "육개장",
        "설렁탕", "곰탕", "부대찌개", "갈비탕", "삼계탕",
        "해장국", "라면", "국", "찌개", "탕",
    ],
    "high_protein": [
        "닭가슴살", "삼겹살", "제육볶음", "닭갈비", "참치",
        "연어", "계란볶음밥", "두부조림", "불고기", "스테이크",
        "닭", "고기", "단백질",
    ],
    "korean": [
        "김치찌개", "된장찌개", "제육볶음", "비빔밥", "불고기",
        "순두부찌개", "잡채", "갈비", "삼겹살", "떡볶이",
        "순대", "파전", "계란볶음밥", "미역국", "나물",
        "볶음밥", "덮밥", "국밥", "찌개", "조림",
    ],
    "quick": [
        "계란볶음밥", "라면", "토스트", "볶음밥", "샌드위치",
        "주먹밥", "참치마요밥", "계란후라이", "컵라면", "즉석",
    ],
    "healthy": [
        "샐러드", "닭가슴살", "현미밥", "두부조림", "나물비빔밥",
        "미역국", "오트밀", "그릭요거트", "두부", "채소볶음",
        "건강", "저칼로리", "다이어트",
    ],
}

CATEGORY_LABELS: dict[str, str] = {
    "spicy": "매운 음식",
    "soup": "국물 음식",
    "high_protein": "고단백 음식",
    "korean": "한식",
    "quick": "간단한 요리",
    "healthy": "건강식",
}


def classify_food(food_name: str) -> set[str]:
    """음식 이름을 카테고리 집합으로 분류한다(키워드 부분일치).

    재정렬·상황 적합도 계산에서 후보 메뉴의 성격을 파악하는 데 재사용된다.
    """
    cats: set[str] = set()
    for category, keywords in FOOD_CATEGORIES.items():
        if any(kw in food_name or food_name in kw for kw in keywords):
            cats.add(category)
    return cats


def preferred_categories(food_history: list[str], threshold: float = 0.2) -> set[str]:
    """선택 기록에서 threshold 이상 비중을 차지하는 '선호 카테고리'를 반환."""
    prefs = analyze_preferences(food_history)
    return {cat for cat, score in prefs.items() if score >= threshold}


def analyze_preferences(food_history: list[str]) -> dict[str, float]:
    """선택 기록을 기반으로 카테고리별 선호도 비율(0~1)을 반환."""
    if not food_history:
        return {}

    counts: dict[str, int] = defaultdict(int)
    total = len(food_history)

    for food in food_history:
        for category, keywords in FOOD_CATEGORIES.items():
            if any(kw in food or food in kw for kw in keywords):
                counts[category] += 1

    return {cat: count / total for cat, count in counts.items() if count > 0}


def format_preferences_for_prompt(preferences: dict[str, float], threshold: float = 0.2) -> str:
    """선호도 dict를 프롬프트 삽입용 문자열로 변환.

    threshold 이상의 카테고리만 '선호'로 표시.
    """
    if not preferences:
        return ""

    strong = [
        CATEGORY_LABELS[cat]
        for cat, score in sorted(preferences.items(), key=lambda x: -x[1])
        if score >= threshold and cat in CATEGORY_LABELS
    ]

    if not strong:
        return ""

    lines = "\n".join(f"- {label} 선호" for label in strong)
    return f"{lines}\n위 선호도를 추천 시 우선적으로 반영해."
