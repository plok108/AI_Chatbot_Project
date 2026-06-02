"""규칙 기반 재정렬.

GPT가 생성한 메뉴 후보를, 우리 코드가 결정론적 점수 함수로 다시 정렬한다.
같은 입력이면 항상 같은 순위가 나오므로(재현 가능) 순수 LLM 대비 통제력이 생긴다.

최종 점수 = w_usage·활용률 + w_pref·취향일치 + w_context·상황적합 + w_cost·비용효율
각 부분 점수는 0~100 범위로 맞춘 뒤, config의 가중치를 곱해 합산한다.
"""

from app.config import (
    WEIGHT_CONTEXT,
    WEIGHT_COST,
    WEIGHT_PREFERENCE,
    WEIGHT_USAGE,
)
from app.services.preference_service import classify_food

# ── 점수 기준값 (매직 넘버 대신 이름을 붙여 의미를 드러냄) ──────
SCORE_MAX = 100.0        # 부분 점수의 최댓값
SCORE_MIN = 0.0          # 부분 점수의 최솟값
SCORE_MATCH = 100.0      # 조건에 들어맞을 때
SCORE_NEUTRAL = 50.0     # 판단 근거가 없을 때(불이익 없음)
SCORE_MISMATCH = 40.0    # 상황에 어울리지 않을 때 약간 감점

# 추가 비용이 이 금액(원) 이상이면 비용 점수가 0이 된다.
COST_ZERO_AT_WON = 5000.0

# 상황별로 점수를 더 주는 카테고리
COLD_WEATHER_FAVORS = {"soup", "korean"}   # 춥거나 비/눈 → 국물·한식
HOT_WEATHER_FAVORS = {"quick", "healthy"}  # 더움 → 간단·가벼움
LATE_NIGHT_FAVORS = {"quick"}              # 야식 → 간단


def _clamp(value: float) -> float:
    """점수를 0~100 범위로 자른다."""
    return max(SCORE_MIN, min(SCORE_MAX, value))


def _usage_score(candidate: dict) -> float:
    """재료 활용률을 그대로 점수로 사용(0~100)."""
    return _clamp(float(candidate.get("usage_rate", 0)))


def _preference_score(candidate: dict, preferred: set[str]) -> float:
    """후보가 사용자의 선호 카테고리와 겹치면 만점, 아니면 중립."""
    if not preferred:
        return SCORE_NEUTRAL
    categories = classify_food(str(candidate.get("name", "")))
    return SCORE_MATCH if (categories & preferred) else SCORE_NEUTRAL


def _favored_categories(context: dict) -> set[str]:
    """현재 상황(날씨/시간)에 어울리는 카테고리 집합을 만든다."""
    favored: set[str] = set()
    weather = context.get("weather")
    if weather:
        if weather.get("is_cold") or weather.get("is_rainy"):
            favored |= COLD_WEATHER_FAVORS
        if weather.get("is_hot"):
            favored |= HOT_WEATHER_FAVORS
    if context.get("time_of_day") == "late_night":
        favored |= LATE_NIGHT_FAVORS
    return favored


def _context_score(candidate: dict, context: dict | None) -> float:
    """상황에 어울리면 가점, 어울리지 않으면 감점. 상황 정보가 없으면 중립."""
    if not context:
        return SCORE_NEUTRAL

    favored = _favored_categories(context)
    if not favored:
        return SCORE_NEUTRAL

    categories = classify_food(str(candidate.get("name", "")))
    return SCORE_MATCH if (categories & favored) else SCORE_MISMATCH


def _cost_score(candidate: dict) -> float:
    """추가 비용이 적을수록 높음. 0원이면 만점, COST_ZERO_AT_WON원이면 0점."""
    cost = float(candidate.get("extra_cost", 0) or 0)
    return _clamp(SCORE_MAX * (1 - cost / COST_ZERO_AT_WON))


def score_candidate(candidate: dict, preferred: set[str], context: dict | None) -> float:
    """네 가지 부분 점수를 가중 합산한 최종 점수."""
    return (
        WEIGHT_USAGE * _usage_score(candidate)
        + WEIGHT_PREFERENCE * _preference_score(candidate, preferred)
        + WEIGHT_CONTEXT * _context_score(candidate, context)
        + WEIGHT_COST * _cost_score(candidate)
    )


def rank_candidates(
    candidates: list[dict],
    preferred: set[str],
    context: dict | None,
) -> list[dict]:
    """점수가 높은 순으로 재정렬한 새 리스트를 반환(동점이면 원래 순서 유지)."""
    # 각 후보에 점수와 원래 순서를 함께 기록
    scored = []
    for original_order, candidate in enumerate(candidates):
        scored.append({
            "candidate": candidate,
            "score": score_candidate(candidate, preferred, context),
            "original_order": original_order,
        })

    # 점수 내림차순, 동점이면 원래 순서 오름차순
    scored.sort(key=lambda item: (-item["score"], item["original_order"]))

    return [item["candidate"] for item in scored]
