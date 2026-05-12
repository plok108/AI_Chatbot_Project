# 🍽️ LLM AI Food Recommendation Project

AI 기반 음식 추천 웹 애플리케이션입니다.

사용자의 현재 상황, 기분, 보유 재료를 기반으로 GPT가 음식, 배달 음식, 간편식 등을 추천합니다.

---

# 🚀 Tech Stack

## Frontend
- React
- Vite
- CSS

## Backend
- FastAPI
- Python
- PostgreSQL
- OpenAI API (gpt-4o-mini)

## Database
- Railway PostgreSQL

## Environment
- Python venv
- Node.js
- Git / GitHub

---

# 📂 Project Structure

```text
LLM_AI_Project
│
├─ frontend
│  ├─ src
│  ├─ public
│  ├─ package.json
│  └─ vite.config.js
│
└─ backend
   ├─ app
   │  ├─ models
   │  ├─ routers
   │  ├─ services
   │  └─ sql
   │
   ├─ main.py
   ├─ requirements.txt
   ├─ .env.example
   └─ venv
```

---

# ✨ Features

- AI 음식 추천
- 상황 기반 추천
- 배달 음식 추천
- 다이어트 음식 추천
- PostgreSQL 저장
- 추천 기록 관리
- FastAPI REST API
- React UI

---

# ⚙️ Backend Setup

## 1. Move to backend directory

```bash
cd backend
```

## 2. Create virtual environment

```bash
python -m venv venv
```

## 3. Activate virtual environment

### Windows PowerShell

```bash
.\venv\Scripts\Activate.ps1
```

---

## 4. Install packages

```bash
pip install -r requirements.txt
```

---

## 5. Create .env file

Create `.env` inside backend folder.

```env
DATABASE_URL=your_postgresql_url
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

---

## 6. Run backend server

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

---

# 💻 Frontend Setup

## 1. Move to frontend directory

```bash
cd frontend
```

---

## 2. Install packages

```bash
npm install
```

---

## 3. Run frontend server

```bash
npm run dev
```

---

# 🌐 Local URLs

## Frontend

```text
http://localhost:5173
```

## Backend

```text
http://127.0.0.1:8000
```

## Swagger API Docs

```text
http://127.0.0.1:8000/docs
```

---

# 📌 Example API Request

```json
{
  "ingredients": ["계란", "김치"],
  "situation": "다이어트 중",
  "mood": "요리하기 싫음",
  "user_message": "배달 음식 추천해줘"
}
```

---

# 🗄️ Database Schema

## chat_logs

| Column | Type |
|---|---|
| id | BIGSERIAL |
| ingredients | JSONB |
| situation | TEXT |
| mood | TEXT |
| user_message | TEXT |
| ai_response | TEXT |
| created_at | TIMESTAMPTZ |

---

# 🔒 Environment Variables

`.env` file is NOT uploaded to GitHub.

Sensitive information:

- OpenAI API Key
- PostgreSQL URL
- Database Password

---

# 📦 Git Ignore

Excluded from GitHub:

```text
venv/
node_modules/
.env
__pycache__/
```

---

# 📈 Future Improvements

- Chat history UI
- User authentication
- Recommendation personalization
- Nutrition analysis
- Mobile responsive UI
- Docker deployment
- Cloud deployment

---

# 👨‍💻 Team Project

This project was built as an AI-powered food recommendation web service using:

- React
- FastAPI
- PostgreSQL
- OpenAI GPT API

---

# 📄 License

MIT License

