# 냉털이 (AI 챗봇) — 전체 수정 내역

> 프로젝트: React 19 + FastAPI (Python) + PostgreSQL + OpenAI GPT-4o-mini
> 작성일: 2026-05-31

---

## 목차

1. [1차 — 백엔드 전면 구축 + 프론트 API 연결](#1차--백엔드-전면-구축--프론트-api-연결)
2. [2차 — 설정 페이지 계정 정보 및 버튼 수정](#2차--설정-페이지-계정-정보-및-버튼-수정)
3. [3차 — 더미 데이터 제거 + 회원탈퇴 모달 검증](#3차--더미-데이터-제거--회원탈퇴-모달-검증)
4. [4차 — 게스트 설정 분리 + AI 추천 고도화](#4차--게스트-설정-분리--ai-추천-고도화--데이터-관리-정책)
5. [5차 — AI 추천 스타일 게스트 개방](#5차--ai-추천-스타일-게스트-개방)
6. [6차 — 기피음식 채팅 반영](#6차--기피음식-채팅-반영)
7. [7차 — 기피음식 DB 영구 저장](#7차--기피음식-db-영구-저장)
8. [8차 — 다크모드 실제 구현](#8차--다크모드-실제-구현)
9. [9차 — 추천 기록 유실 수정](#9차--추천-기록-유실-수정)
10. [전체 수정 파일 목록](#전체-수정-파일-목록)
11. [API 엔드포인트 전체 목록](#api-엔드포인트-전체-목록)
12. [DB 테이블 구조](#db-테이블-구조)

---

## 1차 — 백엔드 전면 구축 + 프론트 API 연결

**배경:** 프론트 UI는 거의 완성, 백엔드와 연결이 전혀 안 된 상태

### 백엔드 수정

| 파일 | 수정 내용 |
|------|-----------|
| `app/services/ai_service.py` | `responses.create()` → `chat.completions.create()` 변경, 한국어 시스템 메시지 추가 |
| `app/services/prompt_service.py` | "현실적인 메뉴를 피하고 현실적인 메뉴를" 중복 오타 수정 |
| `app/models/schemas.py` | `RecommendRequest`에 `user_id: Optional[int]` 추가, `IngredientCreate`·`IngredientItem` 스키마 추가 |
| `app/database.py` | `user_ingredients` 테이블 추가, 재료 CRUD 함수 추가, `save_chat_log` 자동 `conversation_id` 생성, `get_chat_history_by_user_id` 추가 |
| `app/routers/chat.py` | `user_id` 지원 추가, DB 저장 재료 자동 로드, `GET /history/{user_id}` 엔드포인트 추가 |
| `app/routers/ingredients.py` | 빈 스텁 → `GET /{user_id}`, `POST /{user_id}`, `DELETE /{ingredient_id}` 완전 구현 |

### 프론트 수정

| 파일 | 수정 내용 |
|------|-----------|
| `src/App.jsx` | `userId`·`userEmail` 상태 추가, 각 컴포넌트에 prop 전달 |
| `src/pages/LoginPage.jsx` | 하드코딩 → `POST /api/auth/login`, `POST /api/auth/register` 실제 API 호출, 이메일 필드로 변경, 로딩 상태 추가 |
| `src/components/ChatPage.jsx` | `setTimeout` 임시 응답 제거 → `POST /api/chat/recommend` 실제 호출, `messages`/`setMessages` props 사용으로 변경 |
| `src/pages/FridgePage.jsx` | 하드코딩 10개 재료 → 실제 재료 API 연결 (로그인: DB 저장, 게스트: 로컬) |
| `src/pages/HistoryPage.jsx` | `userId` 있을 때 `GET /api/chat/history/{userId}` 조회 추가 |
| `src/components/QuickPrompts.jsx` | 카드 클릭 시 `onSelect` 콜백으로 실제 채팅 전송 연결, 각 카드에 `prompt` 텍스트 추가 |

---

## 2차 — 설정 페이지 계정 정보 및 버튼 수정

**배경:**
- 이메일이 `user@example.com (카카오 연동)` 하드코딩
- 닉네임이 `냉파마스터` 하드코딩
- 로그아웃·회원탈퇴 버튼에 `onClick` 없어 동작 안 함

| 파일 | 수정 내용 |
|------|-----------|
| `src/App.jsx` | `userEmail` 상태 추가, `handleLogout` 함수 추가 (모든 상태 초기화 + intro 이동), `SettingsPage`에 `userEmail`·`onLogout` prop 추가 |
| `src/pages/LoginPage.jsx` | `onLogin(data.nickname, data.id, data.email)` — 이메일 콜백 전달 추가 |
| `src/pages/SettingsPage.jsx` | 실제 로그인 이메일·닉네임 표시, 카카오 문구 제거, 로그아웃 `window.confirm` 후 처리, 회원탈퇴 비밀번호 입력 모달 구현 (`POST /api/auth/delete`) |

---

## 3차 — 더미 데이터 제거 + 회원탈퇴 모달 검증

**배경:** 냉장고·히스토리에 임의 데이터 표시, 탈퇴 모달 오류 케이스 미검증

| 파일 | 수정 내용 |
|------|-----------|
| `src/pages/HistoryPage.jsx` | 15개 더미 카드 배열 완전 제거, 빈 상태 메시지로 교체 |
| `src/pages/SettingsPage.jsx` | `aiStyles` 초기값 `['다이어트 중심', '가성비 중심']` → `[]` 제거 |

**검증 결과 (Playwright 자동화 테스트):**

| 케이스 | 결과 |
|--------|------|
| 빈 비밀번호 제출 | "비밀번호를 입력해주세요." alert + 모달 유지 |
| 틀린 비밀번호 제출 | "이메일 또는 비밀번호가 올바르지 않습니다." alert + 모달 유지 |
| 올바른 비밀번호 제출 | 탈퇴 완료 → 로그인 화면 복귀 |
| 탈퇴 계정 재로그인 시도 | HTTP 401 차단 |

---

## 4차 — 게스트 설정 분리 + AI 추천 고도화 + 데이터 관리 정책

**배경:**
- 게스트도 계정 설정(이메일·닉네임 등)이 노출됨
- AI 추천이 재료 활용률·비용 정보를 제공하지 않음
- 게스트 → 로그인 전환 시 데이터 처리 정책 미비

### AI 프롬프트 전면 개편 (`app/services/prompt_service.py`)

**변경 전:** 단순 메뉴 추천
**변경 후:** 보유재료 기반 정형화된 응답

```
[추천 메뉴]
1. 계란파전
    보유재료 활용률: 80% (보유 4개 / 필요 5개 사용)
   사용하는 보유 재료: 달걀, 파, 간장, 참기름
    추가 필요 재료: 부침가루 (약 2,000원)
    예상 추가 비용: 약 2,000원

[추가 구매 요약]
- 총 추가 구매 재료 수: 1가지
- 예상 총 추가 비용: 약 2,000원
- 절약 팁: ...
```

- 보유재료 활용률 높은 순서로 정렬
- 보유재료 없을 시 총 재료비 기준으로 응답

### 설정 페이지 게스트/로그인 분리

| 섹션 | 로그인 | 게스트 |
|------|:------:|:------:|
| 계정 설정 (이메일·닉네임·로그아웃) | O | X |
| 로그인/회원가입 버튼 | X | O |
| 기피 음식 및 알러지 | O | |
| 테마 변경 | O | |
| AI 추천 스타일 설정 | O | → 5차에서 개방 |

### 데이터 관리 정책

- 게스트 추천 기록은 세션 내 로컬에만 저장
- 게스트 → 로그인/회원가입 전환 시 게스트 데이터 초기화
- 로그인 계정의 DB 기록은 유지

| 파일 | 수정 내용 |
|------|-----------|
| `src/App.jsx` | `handleGoToLogin` 추가, `handleLogin`에서 게스트 상태일 때만 데이터 초기화, `isGuest`·`onGoToLogin` prop 전달 |
| `src/pages/SettingsPage.jsx` | 게스트/로그인 완전 분리 렌더링 구현 |

---

## 5차 — AI 추천 스타일 게스트 개방

**배경:** 게스트도 AI 추천 스타일 설정을 사용해야 함

| 파일 | 수정 내용 |
|------|-----------|
| `src/pages/SettingsPage.jsx` | AI 추천 스타일 섹션의 `{!isGuest && ...}` 조건 제거 → 게스트/로그인 모두 표시 |

---

## 6차 — 기피음식 채팅 반영

**배경:** 설정에서 기피음식을 등록해도 채팅 API 요청에 포함되지 않아 AI가 무시함

### 데이터 흐름

```
설정 페이지 기피음식 등록
       ↓
App.jsx dislikedFoods 상태 (페이지 이동해도 유지)
       ↓
ChatPage prop 전달
       ↓
POST /api/chat/recommend 에 disliked_foods 포함
       ↓
prompt_service.py 에서 "절대 제외" 조건으로 프롬프트 삽입
```

### 프롬프트에 추가된 블록

```
 절대 제외 조건 (매우 중요):
- 다음 재료·음식이 포함된 요리는 절대 추천하지 마: 오이, 갑각류
- 주재료든 부재료든 소량이든 상관없이 완전히 제외해.
- 대체 재료 제안 시에도 해당 항목은 절대 포함하지 마.
```

| 파일 | 수정 내용 |
|------|-----------|
| `app/models/schemas.py` | `RecommendRequest`에 `disliked_foods: list[str]` 필드 추가 |
| `app/services/prompt_service.py` | 기피음식 절대 제외 조건 블록 프롬프트에 삽입 |
| `src/App.jsx` | `dislikedFoods` 상태 추가, `ChatPage`·`SettingsPage`에 prop 전달 |
| `src/pages/SettingsPage.jsx` | 로컬 `dislikedFoods` 상태 제거 → App.jsx props 사용으로 교체 |
| `src/components/ChatPage.jsx` | API 요청 body에 `disliked_foods` 포함 |

---

## 7차 — 기피음식 DB 영구 저장

**배경:** 로그인 사용자가 재접속하면 기피음식이 초기화됨. 게스트는 세션 내에서만 유지하면 되지만, 로그인 사용자는 DB에 영구 저장 필요

### 신규 DB 테이블

```sql
CREATE TABLE user_disliked_foods (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, food)
);
```

### 신규 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/preferences/disliked/{user_id}` | 기피음식 목록 조회 |
| `POST` | `/api/preferences/disliked/{user_id}` | 기피음식 추가 |
| `DELETE` | `/api/preferences/disliked/{user_id}/{food}` | 기피음식 삭제 |

### 동작 방식

| 구분 | 동작 |
|------|------|
| 로그인 | `userId` 변화 감지 → DB에서 기피음식 자동 로드 |
| 로그인 상태 추가/삭제 | 로컬 상태 + DB API 동시 처리 |
| 게스트 추가/삭제 | 로컬 상태만 변경 (API 호출 없음) |
| 로그아웃 | `dislikedFoods` 초기화 |

| 파일 | 수정 내용 |
|------|-----------|
| `app/database.py` | `user_disliked_foods` 테이블 추가, `get/add/remove_disliked_food` 함수 추가 |
| `app/routers/preferences.py` | **신규 파일** — 기피음식 CRUD 라우터 |
| `main.py` | preferences 라우터 등록 (`/api/preferences`) |
| `src/App.jsx` | `useEffect`로 로그인 시 DB에서 기피음식 자동 로드, 로그아웃 시 초기화 |
| `src/pages/SettingsPage.jsx` | 로그인 사용자 추가/삭제 시 DB API 동기화, 게스트는 로컬만 |

---

## 8차 — 다크모드 실제 구현

**배경:** 테마 변경 버튼에 "(준비 중)" 표시, 실제로 동작하지 않음

### 구현 방식

- CSS 변수(`var()`) + `data-theme` 속성으로 전역 적용
- `App.jsx` 루트 `<div data-theme={theme}>` → 모든 자식 컴포넌트에 CSS 변수 상속
- React 인라인 스타일에서도 `var()` 사용 가능 → 모든 컴포넌트 일괄 적용

### CSS 변수 목록 (`src/index.css`)

| 변수 | 라이트 | 다크 |
|------|--------|------|
| `--bg-page` | `#f6f3ee` | `#18181b` |
| `--bg-card` | `#ffffff` | `#27272a` |
| `--bg-card-hover` | `#f1f3f5` | `#3f3f46` |
| `--bg-input` | `#f9f9f9` | `#2d2d30` |
| `--bg-ai-bubble` | `#f8f9fa` | `#2d2d30` |
| `--bg-sidebar` | `#ffffff` | `#1c1c1f` |
| `--bg-chat` | `#ffffff` | `#1c1c1f` |
| `--border` | `#eee` | `#3f3f46` |
| `--border-input` | `#ddd` | `#52525b` |
| `--text-heading` | `#111` | `#f4f4f5` |
| `--text-primary` | `#333` | `#e4e4e7` |
| `--text-secondary` | `#555` | `#a1a1aa` |
| `--text-muted` | `#888` | `#71717a` |
| `--text-faint` | `#bbb` | `#52525b` |
| `--shadow-sm` | `rgba(0,0,0,0.05)` | `rgba(0,0,0,0.25)` |
| `--shadow-md` | `rgba(0,0,0,0.08)` | `rgba(0,0,0,0.4)` |

| 파일 | 수정 내용 |
|------|-----------|
| `src/index.css` | `[data-theme="light"]`·`[data-theme="dark"]` CSS 변수 정의 |
| `src/App.jsx` | `theme` 상태 추가, 루트 div에 `data-theme={theme}` 적용, `SettingsPage`에 `theme`·`setTheme` 전달 |
| `src/pages/SettingsPage.jsx` | 로컬 theme 상태 제거 → props 사용, "다크 모드 (준비 중)" → " 다크 모드", 실제 `setTheme` 호출로 전환 |
| `src/components/SideBar.jsx` | 배경·텍스트·hover 색상 → CSS 변수 |
| `src/components/ChatPage.jsx` | 배경·AI 버블·입력창·텍스트 → CSS 변수 |
| `src/components/QuickPrompts.jsx` | 카드 배경·텍스트 → CSS 변수 |
| `src/pages/HistoryPage.jsx` | 카드·버튼·텍스트 → CSS 변수 |
| `src/pages/FridgePage.jsx` | 카드·입력창·텍스트 → CSS 변수 |

---

## 9차 — 추천 기록 유실 수정

**배경:** 로그인 계정임에도 이전 추천 기록이 모두 사라짐

### 원인 분석

| 원인 | 상세 |
|------|------|
| HistoryPage replace 버그 | `if (apiItems.length > 0) setRecords(apiItems)` — DB 기록이 오면 현재 세션 로컬 기록을 완전히 덮어씀 |
| handleLogin 무조건 초기화 | 게스트가 아닌 경우에도 `setHistoryItems([])` 실행해 세션 기록 삭제 |
| SQL JOIN 조건 과도 | `AND l2.user_id = l1.user_id` 조건이 일부 케이스에서 assistant 메시지 매칭 실패 |

### 수정 내용

**병합(merge) 방식으로 변경 — `src/pages/HistoryPage.jsx`**

```
병합 결과 = [현재 세션 로컬 기록 (상단)] + [DB 기록 (하단, 중복 제외)]
```

- DB 결과가 있어도 로컬 기록을 보존
- 불러오는 동안 "기록을 불러오는 중..." 로딩 상태 표시
- API 실패 시 로컬 기록만 표시 (fallback)

| 파일 | 수정 내용 |
|------|-----------|
| `src/pages/HistoryPage.jsx` | replace → merge 방식 변경, 로딩 상태 추가, API 실패 fallback 추가 |
| `src/App.jsx` | `handleLogin`에서 게스트 상태(`isGuest === true`)일 때만 `historyItems` 초기화 |
| `app/database.py` | SQL JOIN에서 `AND l2.user_id = l1.user_id` 제거 → `conversation_id`만으로 assistant 메시지 매칭 |

> **참고:** `user_id` 없이 저장된 과거 채팅 기록(코드 수정 이전 기록)은 어느 사용자의 것인지 알 수 없어 복구 불가. 이후 로그인 상태에서 채팅하면 모두 정상 저장·조회됨.

---

## 전체 수정 파일 목록

### 백엔드 (8개)

```
backend/
├── main.py ← preferences 라우터 등록
└── app/
    ├── database.py ← 테이블 추가, CRUD 함수 추가
    ├── models/
    │ └── schemas.py ← disliked_foods, user_id 필드 추가
    ├── services/
    │ ├── ai_service.py ← chat.completions API로 변경
    │ └── prompt_service.py ← 프롬프트 전면 개편
    └── routers/
        ├── chat.py ← user_id 지원, 히스토리 엔드포인트
        ├── ingredients.py ← 완전 CRUD 구현
        └── preferences.py ← 신규: 기피음식 API
```

### 프론트엔드 (9개)

```
frontend/src/
├── App.jsx ← 상태 관리 중앙화
├── index.css ← 다크모드 CSS 변수 정의
├── components/
│ ├── ChatPage.jsx ← 실제 API 연결, CSS 변수
│ ├── SideBar.jsx ← CSS 변수 적용
│ └── QuickPrompts.jsx ← 클릭 이벤트 연결, CSS 변수
└── pages/
    ├── LoginPage.jsx ← 실제 API 연결
    ├── SettingsPage.jsx ← 계정 정보, 게스트 분리, 다크모드
    ├── HistoryPage.jsx ← 병합 로직, 로딩 상태, CSS 변수
    └── FridgePage.jsx ← 실제 API 연결, CSS 변수
```

---

## API 엔드포인트 전체 목록

### 인증 (`/api/auth`)

| 메서드 | 경로 | 설명 | 요청 body |
|--------|------|------|-----------|
| `POST` | `/api/auth/register` | 회원가입 | `{email, password, nickname}` |
| `POST` | `/api/auth/login` | 로그인 | `{email, password}` |
| `POST` | `/api/auth/delete` | 회원탈퇴 | `{email, password}` |

### 채팅 (`/api/chat`)

| 메서드 | 경로 | 설명 | 요청 body |
|--------|------|------|-----------|
| `POST` | `/api/chat/recommend` | AI 음식 추천 | `{user_id?, user_message, ingredients?, disliked_foods?}` |
| `GET` | `/api/chat/history/{user_id}` | 추천 기록 조회 | — |

### 냉장고 재료 (`/api/ingredients`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/ingredients/{user_id}` | 재료 목록 조회 |
| `POST` | `/api/ingredients/{user_id}` | 재료 추가 `{name}` |
| `DELETE` | `/api/ingredients/{ingredient_id}?user_id={id}` | 재료 삭제 |

### 기피음식 (`/api/preferences`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/preferences/disliked/{user_id}` | 기피음식 목록 조회 |
| `POST` | `/api/preferences/disliked/{user_id}` | 기피음식 추가 `{food}` |
| `DELETE` | `/api/preferences/disliked/{user_id}/{food}` | 기피음식 삭제 |

---

## DB 테이블 구조

```sql
-- 사용자
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL, -- PBKDF2-SHA256, 200,000 iterations
    nickname VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 채팅 로그
CREATE TABLE chat_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    conversation_id BIGINT, -- ms 타임스탬프로 자동 생성
    role VARCHAR(20) NOT NULL, -- 'user' | 'assistant'
    ingredients JSONB DEFAULT '[]',
    message TEXT NOT NULL,
    recommendation_style VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 냉장고 재료
CREATE TABLE user_ingredients (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 기피음식
CREATE TABLE user_disliked_foods (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, food)
);
```
