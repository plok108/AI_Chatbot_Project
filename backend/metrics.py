"""추천 통계/지표 계산 스크립트.

recommendation_events(추천 기록)와 user_food_history(선택 기록)를 읽어
설정(기능 on/off)별로 지표를 계산해 표로 출력한다.

실행:  (backend 폴더에서)  python metrics.py

지표
- 추천 수용률   = 선택된 추천 수 / 전체 추천 수
- 평균 재료 활용률 = 모든 후보 usage_rate의 평균
- 기피음식 위반율 = 기피·알러지가 섞인 후보 / 전체 후보 (목표 0%)
- 평균 제거 후보 수 = 안전 필터가 걸러낸 후보 수의 평균
"""

from collections import defaultdict
from statistics import mean

from app.database import get_recommendation_events, get_selected_conversation_ids
from app.services.safety_service import is_blocked


def mode_label(safety: bool, rerank: bool, context: bool) -> str:
    """기능 on/off 조합을 사람이 읽는 실험 버전 이름으로."""
    if not safety and not rerank and not context:
        return "A. 기준선(GPT만)"
    if safety and not rerank and not context:
        return "B1. +안전필터"
    if safety and rerank and not context:
        return "B2. +재정렬"
    if safety and rerank and context:
        return "B3. 제안 전체"
    return f"기타(safety={safety}, rerank={rerank}, context={context})"


def summarize_group(events: list[dict], selected_ids: set[int]) -> dict:
    """한 설정 그룹의 지표를 계산한다."""
    rec_count = len(events)
    accepted = sum(1 for e in events if e["conversation_id"] in selected_ids)

    usage_values: list[float] = []
    total_candidates = 0
    violations = 0
    removed_values: list[int] = []

    for e in events:
        disliked = e["disliked_foods"] or []
        removed_values.append(e["removed_count"])
        for cand in e["candidates"]:
            total_candidates += 1
            usage_values.append(float(cand.get("usage_rate", 0)))
            if disliked and is_blocked(cand, disliked):
                violations += 1

    return {
        "rec_count": rec_count,
        "accepted": accepted,
        "acceptance_rate": (accepted / rec_count) if rec_count else 0.0,
        "total_candidates": total_candidates,
        "avg_usage": mean(usage_values) if usage_values else 0.0,
        "violations": violations,
        "violation_rate": (violations / total_candidates) if total_candidates else 0.0,
        "avg_removed": mean(removed_values) if removed_values else 0.0,
    }


def main() -> None:
    events = get_recommendation_events()
    selected_ids = get_selected_conversation_ids()

    if not events:
        print("기록된 추천 이벤트가 없습니다. 먼저 추천을 몇 번 실행해 데이터를 쌓아주세요.")
        return

    # 설정(기능 on/off) 조합별로 묶기
    groups: dict[tuple, list[dict]] = defaultdict(list)
    for e in events:
        key = (e["enable_safety"], e["enable_rerank"], e["enable_context"])
        groups[key].append(e)

    print("=" * 60)
    print("냉털이 추천 평가 지표 (recommendation_events 기반)")
    print("=" * 60)

    # 보기 좋게 정렬: 켜진 기능이 적은 순(기준선이 위로)
    for key in sorted(groups, key=lambda k: sum(1 for v in k if v)):
        safety, rerank, context = key
        m = summarize_group(groups[key], selected_ids)

        print(f"\n[{mode_label(safety, rerank, context)}]"
              f"  (safety={safety}, rerank={rerank}, context={context})")
        print(f"  추천 횟수        : {m['rec_count']}")
        print(f"  선택 횟수        : {m['accepted']}  → 수용률 {m['acceptance_rate']*100:.1f}%")
        print(f"  추천 메뉴 총수   : {m['total_candidates']}")
        print(f"  기피음식 위반    : {m['violations']}  → 위반율 {m['violation_rate']*100:.1f}%")
        print(f"  평균 재료 활용률 : {m['avg_usage']:.1f}%")
        print(f"  평균 제거 후보수 : {m['avg_removed']:.2f}")

    print("\n" + "=" * 60)
    print("팁: 같은 시나리오를 .env의 ENABLE_* 값만 바꿔 두 번 돌리면")
    print("    위 두 블록이 baseline vs 제안 비교표가 됩니다.")
    print("=" * 60)


if __name__ == "__main__":
    main()
