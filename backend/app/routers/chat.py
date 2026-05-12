from fastapi import APIRouter, HTTPException

from app.database import save_chat_log
from app.models.schemas import RecommendRequest, RecommendResponse
from app.services.ai_service import get_ai_recommendation
from app.services.prompt_service import build_meal_prompt

router = APIRouter()


@router.post("/recommend", response_model=RecommendResponse)
def recommend_meal(request: RecommendRequest):
    prompt = build_meal_prompt(request)

    try:
        ai_response = get_ai_recommendation(prompt)
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"AI recommendation failed: {str(error)}",
        )

    saved_id = save_chat_log(
        ingredients=request.ingredients,
        situation=request.situation,
        mood=request.mood,
        user_message=request.user_message,
        ai_response=ai_response,
    )

    return RecommendResponse(
        id=saved_id,
        recommendation=ai_response,
    )