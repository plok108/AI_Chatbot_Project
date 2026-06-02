"""결정론적 안전 필터 (다층 방어).

기피음식·알러지를 프롬프트(부탁)가 아니라 코드에서 강제로 제거한다.
검사 대상: 후보의 이름 + GPT가 펼친 전체 재료(ingredients) + 부족 재료(missing_ingredients).

다층 방어
  (나) 동의어/카테고리 사전으로 직접 검사
  (다) 숨은 양념 규칙표로 함의된 알러지원 검사 (예: 새우젓 → 새우·갑각류)
  (라) 재료 정보가 전혀 없어 검증 불가하면 제거하지 않되 경고 표시('애매하면 알린다')

※ 의학적 안전을 100% 보장하지 않으며, 최종 확인은 사용자 몫이다(면책).
"""

# 대표어 → 동의어/관련어 사전 (부분일치 검사용)
SYNONYMS: dict[str, list[str]] = {
    "새우": ["새우", "대하", "깐새우", "칵테일새우", "쉬림프", "새우젓", "건새우"],
    "갑각류": ["새우", "게", "꽃게", "대게", "랍스터", "가재", "크랩"],
    "오이": ["오이", "오이무침", "오이냉국", "오이소박이"],
    "가지": ["가지", "가지볶음", "가지무침"],
    "우유": ["우유", "milk", "크림", "치즈", "버터", "라떼"],
    "유제품": ["우유", "치즈", "버터", "크림", "요거트", "생크림"],
    "땅콩": ["땅콩", "피넛", "peanut"],
    "견과류": ["견과", "땅콩", "호두", "아몬드", "캐슈", "잣", "피칸"],
    "계란": ["계란", "달걀", "에그", "egg"],
    "달걀": ["계란", "달걀", "에그", "egg"],
    "돼지고기": ["돼지", "제육", "삼겹", "목살", "돈까스", "보쌈", "수육"],
    "소고기": ["소고기", "쇠고기", "불고기", "스테이크", "차돌", "우삼겹"],
    "닭고기": ["닭", "치킨", "닭갈비", "삼계"],
    "생선": ["생선", "고등어", "갈치", "참치", "연어", "멸치", "어묵"],
    "조개": ["조개", "바지락", "홍합", "굴", "모시조개"],
    "복숭아": ["복숭아", "피치"],
    "고수": ["고수", "샹차이", "실란트로"],
    "밀": ["밀", "면", "국수", "파스타", "라면", "빵", "부침", "수제비", "칼국수"],
}

# 숨은 양념·가공품 → 그것이 함의하는 알러지원 (결정론적 보강)
SEASONING_ALLERGENS: dict[str, list[str]] = {
    "새우젓": ["새우", "갑각류"],
    "새우가루": ["새우", "갑각류"],
    "건새우": ["새우", "갑각류"],
    "액젓": ["생선", "갑각류", "멸치"],
    "멸치액젓": ["생선", "멸치"],
    "까나리액젓": ["생선"],
    "멸치육수": ["생선", "멸치"],
    "다시다": ["소고기"],
    "굴소스": ["굴", "조개"],
    "피쉬소스": ["생선", "갑각류"],
    "우스터소스": ["생선"],
    "마요네즈": ["계란"],
    "버터": ["유제품", "우유"],
    "마가린": ["유제품"],
    "치즈": ["유제품", "우유"],
    "생크림": ["유제품", "우유"],
    "크림": ["유제품", "우유"],
    "요거트": ["유제품", "우유"],
    "분유": ["유제품", "우유"],
    "땅콩버터": ["땅콩", "견과류"],
    "어묵": ["생선"],
    "맛살": ["생선", "갑각류"],
    "게맛살": ["갑각류", "생선"],
}


# 재료를 검증할 수 없을 때 후보에 붙이는 경고 문구
UNVERIFIABLE_WARNING = "재료를 확인할 수 없어요. 알러지가 있다면 드시기 전 꼭 확인하세요."


def _expand(term: str) -> set[str]:
    """기피 항목 하나를 검사용 키워드 집합으로 확장한다."""
    keys = {term}
    if term in SYNONYMS:
        keys.update(SYNONYMS[term])
    return {k for k in keys if k}


def candidate_haystack(candidate: dict) -> str:
    """후보의 이름 + 전체 재료 + 부족 재료명을 합친 검사 대상 문자열."""
    parts = [str(candidate.get("name", ""))]
    parts.extend(str(i) for i in candidate.get("ingredients", []) or [])
    for m in candidate.get("missing_ingredients", []) or []:
        parts.append(str(m.get("name", "")))
    return " ".join(parts)


def implied_allergens(haystack: str) -> set[str]:
    """숨은 양념 규칙표로부터 함의된 알러지원 집합을 추출한다."""
    result: set[str] = set()
    for seasoning, allergens in SEASONING_ALLERGENS.items():
        if seasoning in haystack:
            result.update(allergens)
    return result


def has_ingredient_info(candidate: dict) -> bool:
    """재료 구성을 검증할 정보(전체 재료 목록)가 있는지."""
    return bool(candidate.get("ingredients"))


def is_blocked(candidate: dict, disliked_foods: list[str]) -> bool:
    """후보가 기피 항목 중 하나라도 포함하면 True (직접 + 양념 함의)."""
    haystack = candidate_haystack(candidate)
    implied = implied_allergens(haystack)
    for term in disliked_foods:
        term = (term or "").strip()
        if not term:
            continue
        keys = _expand(term)
        # (나) 직접 검사
        if any(k in haystack for k in keys):
            return True
        # (다) 숨은 양념이 함의한 알러지원과 대조
        if keys & implied:
            return True
    return False


def filter_candidates(
    candidates: list[dict], disliked_foods: list[str]
) -> tuple[list[dict], list[dict]]:
    """후보를 (표시, 제거)로 분리한다.

    - 명확히 걸린 후보 → 제거(removed)
    - 알러지가 있는데 재료 정보가 없어 검증 불가한 후보 → 표시하되 safety_note 경고(라)
    반환되는 표시 목록의 dict는 얕은 복사본이며 필요 시 'safety_note'가 채워진다.
    """
    cleaned = [(t or "").strip() for t in (disliked_foods or [])]
    cleaned = [t for t in cleaned if t]
    if not cleaned:
        return list(candidates), []

    visible, removed = [], []
    for c in candidates:
        if is_blocked(c, cleaned):
            removed.append(c)
            continue
        if not has_ingredient_info(c):
            c = {**c, "safety_note": UNVERIFIABLE_WARNING}
        visible.append(c)
    return visible, removed
