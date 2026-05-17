# 🍽️ LLM AI Food Recommendation Project

React + Vite 프론트엔드와 FastAPI 백엔드로 구성된 AI 기반 음식 추천 웹 애플리케이션입니다.

사용자가 입력한 재료, 상황, 기분, 메시지 정보를 바탕으로 OpenAI GPT 모델을 호출해 추천 결과를 생성합니다.

---

# 🚀 Tech Stack

## Frontend
- React
- Vite
- JavaScript
- CSS

## Backend
- FastAPI
- Python
- PostgreSQL
- OpenAI API

## Database
- PostgreSQL

---

# 📂 프로젝트 구조

```text
LLM_AI_Project
│
├─ frontend
│  ├─ public
│  ├─ src
│  │  ├─ App.jsx
│  │  ├─ main.jsx
│  │  ├─ components
│  │  │  ├─ ChatPage.jsx
│  │  │  ├─ QuickPrompts.jsx
│  │  │  └─ SideBar.jsx
│  │  ├─ pages
│  │  │  ├─ FridgePage.jsx
│  │  │  ├─ HistoryPage.jsx
│  │  │  ├─ LoginPage.jsx
│  │  │  └─ SettingsPage.jsx
│  │  ├─ App.css
│  │  └─ index.css
│  ├─ package.json
│  ├─ vite.config.js
│  └─ README.md
│
└─ backend
   ├─ app
   │  ├─ config.py
   │  ├─ database.py
   │  ├─ models
   │  │  └─ schemas.py
   │  ├─ routers
   │  │  ├─ auth.py
   │  │  ├─ chat.py
   │  │  └─ ingredients.py
   │  ├─ services
   │  │  ├─ ai_service.py
   │  │  ├─ auth_service.py
   │  │  └─ prompt_service.py
   │  └─ sql
   │     └─ init.sql
   ├─ main.py
   ├─ requirements.txt
   └─ .env.example
```

---

# 🧩 Frontend 구조

## `frontend/src/App.jsx`
- 앱의 전체 페이지 상태를 관리합니다.
- `Sidebar`, `ChatPage`, `HistoryPage`, `FridgePage`, `SettingsPage`, `LoginPage`를 렌더링합니다.
- 로그인 상태 (`user`)와 현재 페이지 상태 (`currentPage`)를 보관합니다.
- `ChatPage`의 메시지 기록을 `chatMessages` 상태로 관리하고 기록 히스토리를 생성합니다.

## 주요 컴포넌트

### `frontend/src/components/ChatPage.jsx`
- 사용자 입력을 받아 `/api/chat/recommend`에 POST 요청을 보냅니다.
- AI 응답과 사용자 메시지를 채팅 형식으로 표시합니다.
- 음성 녹음 토글과 메시지 입력/전송을 처리합니다.

### `frontend/src/components/Sidebar.jsx`
- 홈, 히스토리, 냉장고, 설정 페이지로 이동합니다.
- 로그인된 사용자 닉네임 또는 게스트 상태를 표시합니다.
- 로그아웃과 로그인 페이지 이동을 제어합니다.

### `frontend/src/components/QuickPrompts.jsx`
- 빠른 추천 메시지 버튼을 제공합니다.
- 사용자가 즉시 추천 요청을 시작할 수 있는 프롬프트를 표시합니다.

## 페이지

### `frontend/src/pages/LoginPage.jsx`
- `login`, `register` 모드를 지원합니다.
- `/api/auth/login`과 `/api/auth/register`를 호출합니다.
- 게스트로 계속하기 기능을 제공합니다.

### `frontend/src/pages/SettingsPage.jsx`
- 로그인된 사용자 닉네임, 이메일을 표시합니다.
- 로그아웃과 회원 탈퇴 기능을 연결합니다.

### `frontend/src/pages/HistoryPage.jsx`
- 이전 추천 대화 기록을 보여주는 페이지입니다.

### `frontend/src/pages/FridgePage.jsx`
- 냉장고 재료 관리 또는 프리뷰 페이지로 활용됩니다.

---

# 🧠 Backend 구조

## `backend/main.py`
- FastAPI 애플리케이션을 생성합니다.
- CORS 미들웨어를 설정합니다.
- `/`, `/health` 기본 엔드포인트를 제공합니다.
- `chat`, `ingredients`, `auth` 라우터를 등록합니다.
- 서버 시작 시 `app.database.init_db()`를 호출해 테이블을 초기화합니다.

## `backend/app/config.py`
- `.env`에서 `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`을 로드합니다.

## `backend/app/database.py`
- PostgreSQL 연결을 관리합니다.
- `users`, `chat_logs` 테이블을 생성하고 초기화합니다.
- 사용자 생성, 조회, 삭제 기능을 제공합니다.
- 채팅 로그 저장 기능을 제공합니다.

## `backend/app/models/schemas.py`
- Pydantic 모델로 요청과 응답 스키마를 정의합니다.
- 추천 요청(`RecommendRequest`), 추천 응답(`RecommendResponse`), 회원가입/로그인 요청(`RegisterRequest`, `LoginRequest`), 사용자 응답(`UserResponse`)을 정의합니다.

## `backend/app/services/ai_service.py`
- OpenAI API를 호출해 추천 결과를 생성합니다.
- `OPENAI_API_KEY`가 없으면 테스트용 안내 텍스트를 반환합니다.

## `backend/app/services/prompt_service.py`
- 추천 메시지 생성을 위한 프롬프트를 만듭니다.
- 사용자 입력 재료, 상황, 기분, 메시지를 결합합니다.

## `backend/app/services/auth_service.py`
- 비밀번호 해시 생성 및 검증(PBKDF2 SHA-256)
- 회원가입, 로그인, 회원 탈퇴 인증을 처리합니다.

## `backend/app/routers/chat.py`
- `POST /api/chat/recommend`
- 추천 요청을 받아 OpenAI 호출 후 결과를 저장하고 반환합니다.

## `backend/app/routers/auth.py`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/delete`

## `backend/app/routers/ingredients.py`
- 현재는 기본 준비 상태 응답만 제공하는 테스트 API입니다.

---

# 🗄️ 데이터베이스 구조

## `users`
| Column | Type | Description |
|---|---|---|
| id | BIGSERIAL | 기본 키 |
| email | VARCHAR(255) UNIQUE | 로그인 이메일 |
| password_hash | VARCHAR(128) | 암호화된 비밀번호 |
| nickname | VARCHAR(50) | 사용자의 닉네임 |
| created_at | TIMESTAMPTZ | 생성 시각 |

## `chat_logs`
| Column | Type | Description |
|---|---|---|
| id | BIGSERIAL | 기본 키 |
| user_id | BIGINT | `users.id` 참조 (현재 로그인 연결은 선택적) |
| conversation_id | BIGINT | 대화 그룹 ID(현재 미사용) |
| role | VARCHAR(20) | `user` 또는 `assistant` |
| ingredients | JSONB | 요청된 재료 목록 |
| message | TEXT | 사용자 또는 AI 메시지 |
| recommendation_style | VARCHAR(100) | 상황/기분 메타 정보 |
| created_at | TIMESTAMPTZ | 저장 시각 |

---

# 🔌 주요 API 엔드포인트

## Backend
- `GET /` : 백엔드 실행 확인
- `GET /health` : 헬스체크
- `POST /api/chat/recommend` : 음식 추천 요청
- `POST /api/auth/register` : 회원가입
- `POST /api/auth/login` : 로그인
- `POST /api/auth/delete` : 회원 탈퇴
- `GET /api/ingredients/` : 재료 API 상태 확인

---

# ⚙️ 실행 방법

## 백엔드
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## 프론트엔드
```bash
cd frontend
npm install
npm run dev
```

---

# 🔒 환경 변수

`backend/.env` 또는 실행 환경에 아래 항목 필수 설정:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

---

# 📌 현재 상태 정리

- 로그인/회원가입/로그아웃/회원 탈퇴 기능을 갖춘 인증 흐름이 구현되어 있습니다.
- `ChatPage`는 실제 백엔드 `/api/chat/recommend` 호출을 사용합니다.
- 현재 OpenAI API 할당량이 초과되면 백엔드에서 429 오류가 발생할 수 있습니다.
- `chat_logs`는 사용자 메시지와 AI 응답을 PostgreSQL에 저장합니다.


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

