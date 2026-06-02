import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from app.config import ENABLE_CONTEXT, ENABLE_RERANK, ENABLE_SAFETY_FILTER
from app.dependencies import get_current_user_id, get_optional_user_id
from app.database import (
    get_chat_history_by_user_id,
    get_disliked_foods,
    get_food_history,
    get_ingredients_by_user_id,
    save_chat_log,
    save_food_history,
    save_recommendation_event,
)
from app.models.schemas import (
    MenuCandidate,
    MenuRecommendResponse,
    MissingIngredient,
    RecipeRequest,
    RecipeResponse,
    RecommendRequest,
    SelectMenuRequest,
)
from app.services.ai_service import get_ai_recommendation, get_menu_candidates
from app.services.context_service import get_context
from app.services.preference_service import (
    analyze_preferences,
    format_preferences_for_prompt,
    preferred_categories,
)
from app.services.prompt_service import build_menu_recommendation_prompt, build_recipe_prompt
from app.services.safety_service import filter_candidates
from app.services.scoring_service import rank_candidates

router = APIRouter()


# ── 공통 헬퍼 (여러 엔드포인트에서 재사용) ──────────────────────

def _resolve_ingredients(ingredients: list[str], user_id: Optional[int]) -> list[str]:
    """재료가 비어 있고 로그인 상태면 DB에 저장된 냉장고 재료를 불러온다."""
    if user_id and not ingredients:
        return [item["name"] for item in get_ingredients_by_user_id(user_id)]
    return ingredients


def _collect_disliked_foods(request_disliked: list[str], user_id: Optional[int]) -> list[str]:
    """요청에 담긴 기피음식과 DB에 저장된 기피음식을 합친다(중복 제거)."""
    disliked = list(request_disliked or [])
    if user_id:
        disliked = list({*disliked, *get_disliked_foods(user_id)})
    return disliked


def _candidate_ingredients(candidate: dict) -> list[str]:
    """후보 dict의 ingredients를 문자열 리스트로 정리."""
    return [str(item) for item in candidate.get("ingredients", []) or []]


def _to_menu_candidates(raw_candidates: list[dict]) -> list[MenuCandidate]:
    """GPT가 준 dict 후보들을 응답용 MenuCandidate 객체로 변환한다."""
    candidates = []
    for c in raw_candidates:
        missing = [
            MissingIngredient(name=m.get("name", ""), cost=m.get("cost", 0))
            for m in c.get("missing_ingredients", [])
        ]
        candidates.append(MenuCandidate(
            name=c.get("name", ""),
            reason=c.get("reason", ""),
            usage_rate=c.get("usage_rate", 0),
            missing_ingredients=missing,
            extra_cost=c.get("extra_cost", 0),
            ingredients=_candidate_ingredients(c),
            safety_note=c.get("safety_note"),
        ))
    return candidates


@router.post("/recommend", response_model=MenuRecommendResponse)
def recommend_meal(
    request: RecommendRequest,
    user_id: Optional[int] = Depends(get_optional_user_id),
):
    """
    1단계: 메뉴 후보 추천
    - 냉장고 재료 분석
    - 기피 음식 및 알러지 필터링
    - 사용자 선호도 반영
    - 레시피 없이 메뉴 카드만 반환

    user_id는 JWT 토큰에서만 추출한다(게스트는 None).
    """
    # 1. 재료 조회 (DB 우선)
    ingredients = _resolve_ingredients(request.ingredients, user_id)

    # 2. 사용자 선호도 분석
    preferences_text = ""
    preferred: set[str] = set()
    if user_id:
        history = get_food_history(user_id)
        prefs = analyze_preferences(history)
        preferences_text = format_preferences_for_prompt(prefs)
        preferred = preferred_categories(history)

    # 2-1. 상황 인식 — 디바이스 시간 + 사용자 수동 날씨(키 있으면 API)
    context = (
        get_context(
            hour=request.client_hour,
            weather_feel=request.weather_feel,
            weather_wet=request.weather_wet,
        )
        if ENABLE_CONTEXT
        else None
    )
    context_text = context["text"] if context else ""

    # 2-2. 기피음식 합치기 (요청 + DB) — 안전 필터/프롬프트에 사용
    disliked = _collect_disliked_foods(request.disliked_foods, user_id)
    modified = request.model_copy(update={"ingredients": ingredients, "disliked_foods": disliked})

    # 3. 프롬프트 생성 + JSON 모드 AI 호출
    prompt = build_menu_recommendation_prompt(modified, preferences_text, context_text)

    try:
        result = get_menu_candidates(prompt)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"AI 추천 실패: {str(error)}")

    # 3-1. 규칙 기반 후처리: 안전 필터 → 재정렬
    raw_candidates = result.get("candidates", [])
    summary = result.get("summary", "")
    removed: list[dict] = []

    if ENABLE_SAFETY_FILTER:
        raw_candidates, removed = filter_candidates(raw_candidates, disliked)
        if removed and not raw_candidates:
            summary = (summary + " (기피·알러지 조건으로 추천 가능한 메뉴가 없습니다.)").strip()

    if ENABLE_RERANK:
        raw_candidates = rank_candidates(raw_candidates, preferred, context)

    # 4. conversation_id 생성
    conversation_id = int(time.time() * 1000)

    # 5. 기존 chat_logs 저장 유지
    ai_response_text = (f"{summary}\n" if summary else "") + "\n".join(
        f"• {c.get('name', '')} — 활용률 {c.get('usage_rate', 0)}%, 추가비용 {c.get('extra_cost', 0):,}원"
        for c in raw_candidates
    )
    save_chat_log(
        ingredients=ingredients,
        situation=request.situation,
        mood=request.mood,
        user_message=request.user_message,
        ai_response=ai_response_text,
        user_id=user_id,
        conversation_id=conversation_id,
    )

    # 5-1. 추천 통계 기록 — 어떤 기능이 켜졌는지 + 후보(활용률·재료)
    save_recommendation_event(
        conversation_id=conversation_id,
        user_id=user_id,
        enable_safety=ENABLE_SAFETY_FILTER,
        enable_rerank=ENABLE_RERANK,
        enable_context=ENABLE_CONTEXT,
        disliked_foods=disliked,
        candidates=[
            {
                "name": c.get("name", ""),
                "usage_rate": c.get("usage_rate", 0),
                "ingredients": _candidate_ingredients(c),
            }
            for c in raw_candidates
        ],
        removed_count=len(removed),
    )

    # 6. 응답 구성
    return MenuRecommendResponse(
        conversation_id=conversation_id,
        candidates=_to_menu_candidates(raw_candidates),
        summary=summary,
    )


@router.post("/select", status_code=201)
def select_menu(
    request: SelectMenuRequest,
    user_id: Optional[int] = Depends(get_optional_user_id),
):
    """
    2단계: 메뉴 선택 저장
    - 로그인 사용자의 선택 기록을 user_food_history에 저장
    - conversation_id 함께 저장 → 어떤 추천 결과에서 선택했는지 추적
    - 이후 추천 시 기피 음식 및 알러지 필터링·선호도 분석에 활용

    user_id는 JWT 토큰에서만 추출한다(게스트는 저장하지 않음).
    """
    if user_id:
        save_food_history(
            user_id=user_id,
            food_name=request.food_name,
            conversation_id=request.conversation_id,
        )
    return {"detail": f"'{request.food_name}' 선택이 저장되었습니다."}


@router.post("/recipe", response_model=RecipeResponse)
def get_recipe_for_menu(
    request: RecipeRequest,
    user_id: Optional[int] = Depends(get_optional_user_id),
):
    """
    3단계: 선택된 메뉴의 레시피 생성
    - 선택한 메뉴에 대해서만 GPT 레시피 생성
    - 보유 재료를 활용한 상세 조리법 제공

    user_id는 JWT 토큰에서만 추출한다(게스트는 None).
    """
    # 재료 조회 (DB 우선)
    ingredients = _resolve_ingredients(request.ingredients, user_id)

    prompt = build_recipe_prompt(food_name=request.food_name, ingredients=ingredients)

    try:
        recipe_text = get_ai_recommendation(prompt)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"레시피 생성 실패: {str(error)}")

    # 기존 chat_logs 저장 유지
    save_chat_log(
        ingredients=ingredients,
        situation=None,
        mood=None,
        user_message=f"{request.food_name} 레시피 요청",
        ai_response=recipe_text,
        user_id=user_id,
        conversation_id=request.conversation_id,
    )

    return RecipeResponse(food_name=request.food_name, recipe=recipe_text)


@router.get("/history")
def get_history(user_id: int = Depends(get_current_user_id)):
    """로그인 사용자의 추천 기록 조회 — user_id는 토큰에서 추출."""
    history = get_chat_history_by_user_id(user_id)
    return {"history": history}
