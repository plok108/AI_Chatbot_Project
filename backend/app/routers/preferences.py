from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.database import add_disliked_food, get_disliked_foods, remove_disliked_food
from app.dependencies import get_current_user_id

router = APIRouter()


class DislikedFoodCreate(BaseModel):
    food: str = Field(max_length=100)


@router.get("/disliked")
def list_disliked_foods(user_id: int = Depends(get_current_user_id)):
    foods = get_disliked_foods(user_id)
    return {"foods": foods}


@router.post("/disliked", status_code=201)
def create_disliked_food(
    body: DislikedFoodCreate,
    user_id: int = Depends(get_current_user_id),
):
    if not body.food.strip():
        raise HTTPException(status_code=400, detail="음식 이름을 입력해주세요.")
    add_disliked_food(user_id=user_id, food=body.food.strip())
    return {"food": body.food.strip()}


@router.delete("/disliked/{food}")
def delete_disliked_food(
    food: str,
    user_id: int = Depends(get_current_user_id),
):
    deleted = remove_disliked_food(user_id=user_id, food=food)
    if not deleted:
        raise HTTPException(status_code=404, detail="해당 항목을 찾을 수 없습니다.")
    return {"detail": "삭제되었습니다."}
