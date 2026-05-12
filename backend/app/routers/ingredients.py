from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_ingredients_status():
    return {
        "message": "Ingredients API is ready"
    }