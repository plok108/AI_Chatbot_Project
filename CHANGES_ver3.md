# 냉털이 — 전체 코드 리뷰

> 작성일: 2026-05-31
> 리뷰 대상: CHANGES.md (1~9차) + CHANGES_ver2.md 기준 최종 코드
> 리뷰 범위: 백엔드(FastAPI/Python) + 프론트엔드(React)

---

## 목차

1. [전체 아키텍처 평가](#1-전체-아키텍처-평가)
2. [백엔드 코드 리뷰](#2-백엔드-코드-리뷰)
   - [보안](#21-보안)
   - [성능](#22-성능)
   - [코드 품질](#23-코드-품질)
   - [API 설계](#24-api-설계)
   - [데이터베이스](#25-데이터베이스)
3. [프론트엔드 코드 리뷰](#3-프론트엔드-코드-리뷰)
   - [상태 관리](#31-상태-관리)
   - [컴포넌트 설계](#32-컴포넌트-설계)
   - [UI/UX](#33-uiux)
4. [개선 권장 사항 요약](#4-개선-권장-사항-요약)

---

## 1. 전체 아키텍처 평가

### 구조 개요

```
[React 19 SPA] → [FastAPI] → [PostgreSQL]
                        ↓
                  [OpenAI GPT-4o-mini]
```

### 긍정적인 점

- **계층 분리가 명확함** — routers / services / database / schemas 로 역할이 분리되어 있어 읽기 쉽고 수정하기 쉽습니다.
- **프론트 상태 중앙 관리** — App.jsx에서 userId, userEmail, dislikedFoods, theme 등 전역 상태를 관리하고 props로 전달하는 구조가 명확합니다.
- **기능 확장성** — 새로운 라우터(preferences, chat/select, chat/recipe)를 추가할 때 기존 코드를 최소한으로 수정했습니다.
- **CSS 변수 기반 다크모드** — `data-theme` 속성 + CSS 변수(`var()`)로 구현하여 인라인 스타일에서도 테마가 즉시 적용됩니다.

### 아키텍처 수준 개선 포인트

| 항목 | 현재 | 권장 |
|------|------|------|
| 인증 방식 | 매 요청마다 `user_id`를 body로 전달 | JWT 토큰 또는 세션 쿠키 |
| 환경 분리 | `.env` 단일 파일 | `dev / prod` 환경별 설정 |
| API URL 하드코딩 | 각 컴포넌트에 `const API_BASE = 'http://localhost:8000'` | 환경변수(`VITE_API_BASE`) 통일 |
| 에러 로깅 | `print` 문 | Python `logging` 모듈 사용 |

---

## 2. 백엔드 코드 리뷰

### 2.1 보안

#### 심각: 인증 없이 user_id를 요청 body로 전달

**현재 코드 (`app/routers/chat.py`)**
```python
@router.post("/recommend", response_model=MenuRecommendResponse)
def recommend_meal(request: RecommendRequest):
    ingredients = request.ingredients
    if request.user_id and not ingredients:
        db_items = get_ingredients_by_user_id(request.user_id) # ← 검증 없음
```

**문제점:** 누구든 `user_id: 999`를 body에 넣어 다른 사용자의 냉장고 재료, 기피음식, 선택 기록에 접근할 수 있습니다.

**권장 수정:** JWT 토큰 방식 도입
```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

def get_current_user(token: str = Depends(security)) -> int:
    # 토큰 검증 후 user_id 반환
    ...

@router.post("/recommend")
def recommend_meal(request: RecommendRequest, user_id: int = Depends(get_current_user)):
    ...
```

---

#### 심각: PBKDF2 iterations 200,000 — CPU 블로킹

**현재 코드 (`app/services/auth_service.py`)**
```python
key = hashlib.pbkdf2_hmac(
    "sha256",
    password.encode("utf-8"),
    salt.encode("utf-8"),
    200_000, # ← 동기 실행 시 ~4.7초
    dklen=32,
)
```

**문제점:**
- FastAPI는 기본적으로 동기 엔드포인트를 스레드풀에서 실행하지만, 200,000 iterations는 하나의 요청이 스레드를 4~5초 점유합니다.
- 동시 접속 시 스레드풀이 빠르게 소진됩니다.

**권장 수정:**
```python
import asyncio
from passlib.context import CryptContext # bcrypt 사용

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 또는 iterations를 100,000으로 줄이고 async 처리
async def verify_password_async(plain: str, hashed: str) -> bool:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, verify_password, plain, hashed)
```

---

#### 주의: CORS 포트 고정

**현재 코드 (`main.py`)**
```python
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]
```

**문제점:** Vite가 5175, 5176 등으로 자동 전환될 경우 매번 수동 추가가 필요합니다.

**권장 수정 (개발 환경):**
```python
import os

if os.getenv("APP_ENV") == "production":
    origins = ["https://your-production-domain.com"]
else:
    # 개발 환경: localhost 전체 허용
    from fastapi.middleware.cors import CORSMiddleware
    app.add_middleware(CORSMiddleware, allow_origin_regex=r"http://.*localhost:\d+", ...)
```

---

#### 주의: SQL Injection 가능성 없음 (양호) — 단, 입력 길이 제한 필요

현재 psycopg의 파라미터 바인딩(`%s`)을 사용하므로 SQL injection 자체는 안전합니다. 다만 입력 길이 검증이 일부 누락되어 있습니다.

**현재 코드 (`app/models/schemas.py`)**
```python
class SelectMenuRequest(BaseModel):
    food_name: str # ← 길이 제한 없음
```

**권장 수정:**
```python
class SelectMenuRequest(BaseModel):
    food_name: str = Field(max_length=100)
```

---

### 2.2 성능

#### 매 요청마다 DB 커넥션 새로 생성

**현재 코드 (`app/database.py`)**
```python
def get_connection():
    return connect(DATABASE_URL) # ← 매번 새 커넥션

def get_ingredients_by_user_id(user_id: int):
    with get_connection() as conn: # ← 함수마다 반복
        ...
```

**문제점:** DB 커넥션 생성 비용이 비쌉니다. 트래픽이 늘면 병목이 됩니다.

**권장 수정:** 커넥션 풀 사용
```python
from psycopg_pool import ConnectionPool

pool = ConnectionPool(DATABASE_URL, min_size=2, max_size=10)

def get_ingredients_by_user_id(user_id: int):
    with pool.connection() as conn:
        ...
```

---

#### 선호도 분석의 카테고리 매칭 비효율

**현재 코드 (`app/services/preference_service.py`)**
```python
for food in food_history: # O(n)
    for category, keywords in FOOD_CATEGORIES.items(): # O(c)
        if any(kw in food or food in kw for kw in keywords): # O(k)
```

**복잡도:** O(n × c × k) — n=선택 수, c=카테고리 수, k=키워드 수

**권장 수정:** 역방향 인덱스 사전 생성
```python
# 모듈 로드 시 한 번만 생성
KEYWORD_TO_CATEGORY: dict[str, str] = {}
for cat, keywords in FOOD_CATEGORIES.items():
    for kw in keywords:
        KEYWORD_TO_CATEGORY[kw] = cat

# 분석 시 O(n × k) → O(n)
def analyze_preferences(food_history: list[str]) -> dict[str, float]:
    counts = Counter(
        KEYWORD_TO_CATEGORY[kw]
        for food in food_history
        for kw in KEYWORD_TO_CATEGORY
        if kw in food or food in kw
    )
    ...
```

---

#### 양호: 기피음식 DB 저장 — `ON CONFLICT DO NOTHING`으로 중복 방지

```python
# app/database.py
sql = """
INSERT INTO user_disliked_foods (user_id, food)
VALUES (%s, %s)
ON CONFLICT (user_id, food) DO NOTHING;
"""
```

애플리케이션 레벨이 아닌 DB 레벨에서 중복을 처리하여 race condition 없이 안전합니다.

---

### 2.3 코드 품질

#### `build_meal_prompt` 함수 미사용 (dead code)

**현재 코드 (`app/services/prompt_service.py`)**
```python
def build_meal_prompt(request: RecommendRequest) -> str:
    # ← ver2 이후 어디에서도 호출되지 않음
```

ver2에서 `build_menu_recommendation_prompt`로 대체되었으나 기존 함수가 남아 있습니다.

**권장:** 제거하거나 향후 폴백(fallback) 용도로 유지한다면 주석으로 명시.

---

#### `app/routers/chat.py` — 임포트 내에 로컬 임포트 존재

**현재 코드**
```python
@router.post("/recommend", response_model=MenuRecommendResponse)
def recommend_meal(request: RecommendRequest):
    ...
    for c in raw_candidates:
        missing = [
            MissingIngredient(...) # ← 최상단 임포트에 이미 있음
            ...
        ]
        candidates.append(MenuCandidate(...)) # ← 동일
```

파일 상단에 이미 임포트되어 있으므로 문제는 없으나, 중복 임포트 코드가 없는지 재확인 필요.

---

#### `save_chat_log` — conversation_id 자동 생성 책임 분산

**현재 코드 (`app/database.py`)**
```python
def save_chat_log(..., conversation_id: Optional[int] = None):
    if conversation_id is None:
        conversation_id = int(time.time() * 1000)
```

`app/routers/chat.py`에서도 독립적으로 생성합니다.
```python
conversation_id = int(time.time() * 1000)
save_chat_log(..., conversation_id=conversation_id)
```

`/recommend`는 라우터에서 생성 후 전달하고, 내부 함수는 그 값을 사용합니다. 일관성이 있으나, 생성 책임이 명확하지 않아 미래 혼선 가능성이 있습니다.

**권장:** 라우터에서 항상 생성해서 전달하거나, `database.py`에서만 생성하는 방향으로 통일.

---

#### 양호: Pydantic `Field` 검증 사용

```python
class RegisterRequest(BaseModel):
    password: str = Field(min_length=8)
    nickname: str = Field(min_length=2, max_length=30)
```

입력 검증이 스키마 레벨에서 자동으로 처리됩니다.

---

### 2.4 API 설계

#### `/api/chat/recommend` — 응답 구조 변경으로 하위 호환성 없음

ver2 이전 클라이언트(또는 외부 연동)가 있다면 기존 `RecommendResponse({id, recommendation: str})`에서 `MenuRecommendResponse({conversation_id, candidates[]})`로 변경되어 breaking change입니다.

**현재 구조로는 문제없으나**, 향후 버저닝이 필요하다면:
```
GET /api/v1/chat/recommend ← 기존
GET /api/v2/chat/recommend ← 신규
```

---

#### `/api/chat/select` — HTTP 상태 코드 일관성

**현재:**
```python
return {"detail": f"'{request.food_name}' 선택이 저장되었습니다."}
# → HTTP 200
```

생성 작업이므로 `201 Created`가 더 적절합니다.
```python
@router.post("/select", status_code=201)
```

---

#### DELETE 메서드에 query param으로 user_id 전달

**현재 코드 (`app/routers/ingredients.py`)**
```python
@router.delete("/{ingredient_id}")
def remove_ingredient(ingredient_id: int, user_id: int): # ← query param
```

인증 없이 `user_id`를 쿼리 파라미터로 받는 것은 보안상 취약합니다. JWT 기반 인증 도입 후에는 토큰에서 user_id를 추출해야 합니다.

---

### 2.5 데이터베이스

#### `chat_logs.user_id` — NOT NULL 제약 없음

**현재 스키마**
```sql
CREATE TABLE chat_logs (
    user_id BIGINT REFERENCES users(id), -- ← NULL 허용
    ...
);
```

게스트 채팅은 `user_id = NULL`로 저장되어 의도한 동작이지만, NULL 레코드가 누적되면 히스토리 쿼리 성능이 저하될 수 있습니다. 인덱스와 파티셔닝을 고려하세요.

**권장 인덱스 추가:**
```sql
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_id
ON chat_logs (user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_logs_conversation_id
ON chat_logs (conversation_id);
```

---

#### `user_food_history` — 인덱스 없음

선호도 분석 시 `WHERE user_id = %s ORDER BY selected_at DESC LIMIT 30` 쿼리가 실행되지만, `user_id`와 `selected_at`에 인덱스가 없습니다.

**권장:**
```sql
CREATE INDEX IF NOT EXISTS idx_food_history_user
ON user_food_history (user_id, selected_at DESC);
```

---

#### 양호: ON DELETE CASCADE 활용

```sql
user_ingredients → REFERENCES users(id) ON DELETE CASCADE
user_disliked_foods → REFERENCES users(id) ON DELETE CASCADE
user_food_history → REFERENCES users(id) ON DELETE CASCADE
```

회원 탈퇴 시 관련 데이터가 자동으로 정리됩니다. 단, `chat_logs`는 CASCADE 없이 수동 삭제합니다(`delete_user_by_email` 함수에서 직접 처리).

---

## 3. 프론트엔드 코드 리뷰

### 3.1 상태 관리

#### `App.jsx` 상태 비대화

**현재 상태 목록 (App.jsx)**
```javascript
const [currentPage, setCurrentPage] = useState("intro");
const [isGuest, setIsGuest] = useState(false);
const [chatKey, setChatKey] = useState(Date.now());
const [historyItems, setHistoryItems] = useState([]);
const [nickname, setNickname] = useState("");
const [userId, setUserId] = useState(null);
const [userEmail, setUserEmail] = useState("");
const [chatMessages, setChatMessages] = useState([]);
const [dislikedFoods, setDislikedFoods] = useState([]);
const [theme, setTheme] = useState('light');
const [ingredients, setIngredients] = useState(""); // ← 사용되지 않음
const [situation, setSituation] = useState(""); // ← 사용되지 않음
const [mood, setMood] = useState(""); // ← 사용되지 않음
const [userMessage, setUserMessage] = useState(""); // ← 사용되지 않음
const [result, setResult] = useState(""); // ← 사용되지 않음
const [savedId, setSavedId] = useState(null); // ← 사용되지 않음
const [loading, setLoading] = useState(false); // ← 사용되지 않음
```

**문제점:** `ingredients`, `situation`, `mood`, `userMessage`, `result`, `savedId`, `loading` — 총 7개의 상태가 초기 API 연결 전 임시로 남아 있으며 실제로 사용되지 않습니다.

**권장:** 미사용 상태 제거
```javascript
// 제거 대상
const [ingredients, setIngredients] = useState("");
const [situation, setSituation] = useState("");
const [mood, setMood] = useState("");
const [userMessage, setUserMessage] = useState("");
const [result, setResult] = useState("");
const [savedId, setSavedId] = useState(null);
const [loading, setLoading] = useState(false);
```

---

#### `startNewConversation`에서도 미사용 상태 초기화

```javascript
const startNewConversation = () => {
    setIngredients(""); // ← 미사용 상태
    setSituation(""); // ← 미사용 상태
    setMood(""); // ← 미사용 상태
    setUserMessage(""); // ← 미사용 상태
    setResult(""); // ← 미사용 상태
    setSavedId(null); // ← 미사용 상태
    ...
};
```

미사용 상태 제거 시 이 코드도 함께 정리됩니다.

---

#### 로그인 시 `theme` 상태 초기화 없음

사용자 A로 로그인해 다크모드 설정 → 로그아웃 → 사용자 B로 로그인 시 다크모드가 유지됩니다. 이것이 의도한 동작인지 명확하지 않습니다.

**권장:** `handleLogout`에서 테마 초기화 또는 DB에 테마 저장:
```javascript
const handleLogout = () => {
    ...
    setTheme('light'); // 로그아웃 시 테마 초기화
};
```

---

### 3.2 컴포넌트 설계

#### `ChatPage.jsx` — `handleSelectMenu` 클로저에서 최신 상태 참조 주의

**현재 코드**
```javascript
const handleSelectMenu = async (conversationId, candidate, messageId) => {
    setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, selectedMenu: candidate.name } : msg
    ));
    setIsLoading(true);
    // ...
    setMessages(prev => [...prev, recipeMsg]);
    // ...
    setMessages(prev => [
        ...prev.map(msg => msg.id === messageId ? { ...msg, selectedMenu: null } : msg),
        errMsg,
    ]);
```

함수형 업데이트(`prev => ...`)를 사용하고 있어 stale closure 문제는 없습니다. 양호한 패턴입니다.

---

#### `HistoryPage.jsx` — `useEffect` 의존성 배열 불완전

**현재 코드**
```javascript
useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE}/api/chat/history/${userId}`)
    ...
}, [userId]); // ← historyItems는 의존성에 없음
```

`historyItems`가 변경되어도 effect가 재실행되지 않으므로, 새로운 대화를 시작해도 히스토리가 즉시 갱신되지 않습니다. 하지만 컴포넌트가 언마운트/리마운트되면 갱신되므로 실용적으로는 큰 문제가 없습니다.

---

#### `SettingsPage.jsx` — 기피음식 입력 중 중복 검사 로직

**현재 코드**
```javascript
const addDislikedFood = async () => {
    const food = foodInput.trim();
    if (!food || dislikedFoods.includes(food)) {
        setFoodInput('');
        return;
    }
```

중복 시 아무 피드백 없이 입력만 지워집니다. 사용자가 이미 있는 항목을 입력하면 왜 추가가 안 되는지 알 수 없습니다.

**권장:**
```javascript
if (dislikedFoods.includes(food)) {
    alert(`'${food}'는 이미 등록된 항목입니다.`);
    return;
}
```

---

#### 양호: `renderRecommendationMessage` 함수 분리

`ChatPage.jsx`에서 추천 메시지 렌더링 로직을 `renderRecommendationMessage(msg)` 함수로 분리하여 JSX의 가독성을 유지했습니다.

---

### 3.3 UI/UX

#### `ChatPage.jsx` — 로딩 중 메뉴 선택 가능

현재 `isLoading=true` 동안 선택 버튼의 `disabled` 처리가 되어 있으나, `handleSelectMenu`가 호출된 직후 `selectedMenu`가 세팅되기 전에 짧은 시간 동안 두 번 클릭이 가능한 race condition이 있습니다.

**권장:** 버튼을 클릭하는 순간 UI 즉시 비활성화:
```javascript
const [isSelecting, setIsSelecting] = React.useState(false);

const handleSelectMenu = async (...) => {
    if (isSelecting) return; // 중복 클릭 방지
    setIsSelecting(true);
    ...
    setIsSelecting(false);
};
```

---

#### `API_BASE` 각 파일에 중복 정의

**현재 상태**
```javascript
// ChatPage.jsx
const API_BASE = 'http://localhost:8000';

// LoginPage.jsx
const API_BASE = 'http://localhost:8000';

// FridgePage.jsx
const API_BASE = 'http://localhost:8000';

// HistoryPage.jsx
const API_BASE = 'http://localhost:8000';

// SettingsPage.jsx
const API_BASE = 'http://localhost:8000';
const PREF_BASE = `${API_BASE}/api/preferences`;
```

백엔드 URL이 변경되면 6개 파일을 모두 수정해야 합니다.

**권장:** `src/api.js` 공통 모듈 생성
```javascript
// src/api.js
export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
```

```
// .env.local
VITE_API_URL=http://localhost:8000

// .env.production
VITE_API_URL=https://api.your-domain.com
```

---

#### `FridgePage.jsx` — 재료 추가 실패 시 `alert()` 사용

```javascript
} catch {
    alert("재료 추가에 실패했습니다.");
    return;
}
```

`alert()`는 브라우저 기본 다이얼로그로, 다크모드/라이트모드 테마와 어울리지 않습니다.

**권장:** 인라인 에러 메시지 상태 사용
```javascript
const [errorMsg, setErrorMsg] = useState('');

// 실패 시
setErrorMsg("재료 추가에 실패했습니다.");
setTimeout(() => setErrorMsg(''), 3000);

// JSX에서
{errorMsg && <p style={{ color: '#ef4444' }}>{errorMsg}</p>}
```

---

#### 로그인 폼 — 이메일 형식 클라이언트 검증 없음

**현재 코드 (`LoginPage.jsx`)**
```javascript
const handleSubmit = async (e) => {
    if (isLoginMode) {
        if (!email || !password) return alert("이메일과 비밀번호를 입력해주세요.");
    }
    // 이메일 형식 검증 없음 → 백엔드 Pydantic에서 처리
```

백엔드가 `EmailStr`로 검증하므로 기능적으로는 정상이지만, 잘못된 형식 입력 시 서버 왕복 후에야 에러가 표시됩니다.

**권장:** 클라이언트 사전 검증
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
    alert("올바른 이메일 형식을 입력해주세요.");
    return;
}
```

---

#### 양호: `QuickPrompts` — `onSelect` prop으로 실제 채팅 연결

```javascript
// QuickPrompts.jsx
onClick={() => onSelect && onSelect(card.prompt)}
```

빠른 메뉴 클릭 시 `handleSend`가 직접 호출되어 자연스러운 UX를 제공합니다.

---

#### 양호: `HistoryPage` — 로딩 상태 처리

```javascript
const [isLoading, setIsLoading] = useState(!!userId);
// ...
{isLoading && (
    <div>기록을 불러오는 중입니다...</div>
)}
```

DB 조회 중 사용자에게 로딩 상태를 명확히 표시합니다.

---

## 4. 개선 권장 사항 요약

### 즉시 수정 권장 (보안/안정성)

| # | 파일 | 문제 | 수정 방법 |
|---|------|------|-----------|
| 1 | `auth_service.py` | PBKDF2 200,000 iterations → CPU 블로킹 | iterations 줄이기 or `run_in_executor` |
| 2 | 전체 API | user_id를 body로 전달 → 인증 우회 가능 | JWT 토큰 기반 인증 도입 |
| 3 | `schemas.py` | `SelectMenuRequest.food_name` 길이 제한 없음 | `Field(max_length=100)` |

### 단기 개선 권장 (코드 품질)

| # | 파일 | 문제 | 수정 방법 |
|---|------|------|-----------|
| 4 | `App.jsx` | 미사용 상태 7개 잔존 | 제거 |
| 5 | 프론트 전체 | `API_BASE` 6곳 중복 | `src/api.js` 공통 모듈화 |
| 6 | `prompt_service.py` | `build_meal_prompt` 미사용 dead code | 제거 또는 주석 처리 |
| 7 | `main.py` | CORS 포트 고정 | 환경변수 기반 동적 설정 |
| 8 | `ChatPage.jsx` | 메뉴 선택 중복 클릭 race condition | `isSelecting` 가드 추가 |

### 장기 개선 권장 (확장성)

| # | 파일 | 문제 | 수정 방법 |
|---|------|------|-----------|
| 9 | `database.py` | 매 요청 새 DB 커넥션 | `psycopg_pool.ConnectionPool` |
| 10 | DB 전체 | 주요 컬럼 인덱스 없음 | `user_id`, `conversation_id`, `selected_at` 인덱스 추가 |
| 11 | `preference_service.py` | O(n×c×k) 선호도 분석 | 역방향 인덱스 캐싱 |
| 12 | `FridgePage.jsx` | `alert()` 사용 | 인라인 토스트 메시지 |
| 13 | 전체 | 테마 DB 미저장 | `users` 테이블에 `theme` 컬럼 추가 |
| 14 | 전체 | 환경 분리 없음 | `dev/prod` `.env` 분리 |

---

## 전체 평가

```
보안 user_id 인증 없음이 가장 큰 취약점
성능 DB 커넥션 풀 미사용, PBKDF2 블로킹
코드 품질 계층 분리 명확, 미사용 코드 일부 잔존
API 설계 REST 원칙 대체로 준수, 인증 구조 부재
UI/UX 다크모드, 카드 UI, 로딩 상태 양호
확장성 구조는 좋으나 인증/풀/인덱스 보강 필요
```

> 학교 프로젝트 수준으로는 충분히 완성도 높은 코드입니다.
> 실제 서비스 배포를 목표로 한다면 **보안(JWT 인증)** 과 **성능(DB 풀, PBKDF2 비동기)** 을 우선 보완하세요.
