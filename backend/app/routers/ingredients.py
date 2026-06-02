from datetime import date

from fastapi import APIRouter, Depends, HTTPException

from app.database import add_ingredient, delete_ingredient, get_ingredients_by_user_id
from app.dependencies import get_current_user_id
from app.models.schemas import IngredientCreate

router = APIRouter()


@router.get("")
def list_ingredients(user_id: int = Depends(get_current_user_id)):
    items = get_ingredients_by_user_id(user_id)
    return {"ingredients": items}


@router.post("", status_code=201)
def create_ingredient(
    body: IngredientCreate,
    user_id: int = Depends(get_current_user_id),
):
    ingredient_id = add_ingredient(user_id=user_id, name=body.name)
    today = date.today().strftime("%Y.%m.%d")
    return {"id": ingredient_id, "user_id": user_id, "name": body.name, "date": today}


@router.delete("/{ingredient_id}")
def remove_ingredient(
    ingredient_id: int,
    user_id: int = Depends(get_current_user_id),
):
    deleted = delete_ingredient(ingredient_id=ingredient_id, user_id=user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="재료를 찾을 수 없습니다.")
    return {"detail": "삭제되었습니다."}
