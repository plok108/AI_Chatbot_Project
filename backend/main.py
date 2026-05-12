from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import chat, ingredients

app = FastAPI(
    title="Smart Meal Chatbot API",
    description="React + FastAPI backend",
    version="1.0.0",
)

init_db()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Backend is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(chat.router, prefix="/api/chat")
app.include_router(ingredients.router, prefix="/api/ingredients")