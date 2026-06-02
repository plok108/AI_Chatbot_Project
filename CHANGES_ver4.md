# 냉털이 — JWT 인증 도입 + 비밀번호 해시 개선 (ver4)

> 작성일: 2026-06-02
> 기반 버전: CHANGES_ver3.md 코드 리뷰에서 (즉시 수정 권장)으로 분류된 항목 구현
> 범위: 백엔드(FastAPI) + 프론트엔드(React)

---

## 배경

ver3 코드 리뷰에서 가장 심각한 보안 취약점으로 다음이 지적되었다.

| # | 문제 | 심각도 |
|---|------|--------|
| 1 | 모든 API가 `user_id`를 요청 body/path/query로 전달 → 누구나 `user_id`만 바꾸면 타인의 냉장고·기피음식·기록·선택 데이터에 접근 가능 | 높음 |
| 2 | 비밀번호 해시(PBKDF2)의 반복 횟수가 코드에 하드코딩 → 향후 조정 시 기존 해시 전부 무효화 | 높음 |
| 3 | `food_name` 등 자유 입력 필드에 길이 제한 없음 | 중간 |

이번 작업은 위 3가지를 모두 해결한다.

---

## 1. JWT 토큰 기반 인증 도입 (취약점 #1)

### 핵심 원칙

**클라이언트가 보낸 `user_id`를 신뢰하지 않는다.** 신원은 오직 서명된 JWT 토큰에서만 추출한다.

### 인증 흐름

```
로그인/회원가입 성공
      ↓
백엔드가 user_id를 담은 JWT 발급 (HS256 서명, 기본 24시간 만료)
      ↓
프론트가 토큰을 localStorage에 저장
      ↓
이후 모든 요청에 Authorization: Bearer <token> 헤더 첨부
      ↓
백엔드 의존성(get_current_user_id)이 토큰을 검증하고 user_id 추출
      ↓
검증된 user_id로만 DB 조회/수정
```

### 신규 파일 (백엔드)

| 파일 | 역할 |
|------|------|
| `app/services/token_service.py` | `create_access_token(user_id)`, `decode_access_token(token)` — JWT 발급/검증 |
| `app/dependencies.py` | `get_current_user_id`(로그인 필수, 무효 시 401), `get_optional_user_id`(게스트 허용, 무효 시 None) |

### API 엔드포인트 변경 (경로에서 user_id 제거)

| 변경 전 | 변경 후 | 인증 |
|---------|---------|------|
| `GET /api/chat/history/{user_id}` | `GET /api/chat/history` | 필수 |
| `GET /api/ingredients/{user_id}` | `GET /api/ingredients` | 필수 |
| `POST /api/ingredients/{user_id}` | `POST /api/ingredients` | 필수 |
| `DELETE /api/ingredients/{id}?user_id=` | `DELETE /api/ingredients/{id}` | 필수 |
| `GET /api/preferences/disliked/{user_id}` | `GET /api/preferences/disliked` | 필수 |
| `POST /api/preferences/disliked/{user_id}` | `POST /api/preferences/disliked` | 필수 |
| `DELETE /api/preferences/disliked/{user_id}/{food}` | `DELETE /api/preferences/disliked/{food}` | 필수 |
| `POST /api/chat/recommend` | (경로 동일) | 선택(게스트 허용) |
| `POST /api/chat/select` | (경로 동일, 201로 변경) | 선택(게스트 허용) |
| `POST /api/chat/recipe` | (경로 동일) | 선택(게스트 허용) |

- 게스트(토큰 없음)는 `recommend`/`select`/`recipe`를 그대로 사용 가능 → 기존 게스트 흐름 유지
- 로그인 전용 데이터(냉장고·기피음식·기록)는 토큰 없으면 401

### 로그인/회원가입 응답 변경

```jsonc
// 변경 전 (UserResponse)
{ "id": 3, "email": "a@b.com", "nickname": "철수" }

// 변경 후 (AuthResponse)
{ "id": 3, "email": "a@b.com", "nickname": "철수",
  "access_token": "eyJhbGciOi...", "token_type": "bearer" }
```

### 신규 파일 (프론트엔드)

| 파일 | 역할 |
|------|------|
| `src/api.js` | `API_BASE`(환경변수 `VITE_API_URL` 우선), `setToken/getToken/clearToken`, `authHeaders()` — 6곳에 중복되던 `API_BASE`도 통합(ver3 #5 동시 해결) |

- `LoginPage` — 로그인/회원가입 성공 시 `setToken(access_token)`
- `App.jsx` — 로그아웃 시 `clearToken()`
- `ChatPage`/`FridgePage`/`HistoryPage`/`SettingsPage` — 모든 fetch에 `authHeaders()` 적용, 경로에서 user_id 제거

---

## 2. 비밀번호 해시 자기서술적 포맷 (취약점 #2)

### 변경 내용 (`app/services/auth_service.py`)

반복 횟수를 해시 문자열에 함께 저장하여, **기존 해시를 깨지 않고도** 향후 비용을 조정할 수 있게 했다.

```
변경 전: <salt>$<digest> (반복횟수 코드에 하드코딩)
변경 후: pbkdf2_sha256$<iterations>$<salt>$<digest> (자기서술적)
```

- `verify_password`는 신규 4-파트 포맷과 구버전 2-파트 포맷(항상 200,000회)을 **모두 검증** → 기존 사용자 로그인 정상 유지
- `users.password_hash` 컬럼을 `VARCHAR(128)` → `VARCHAR(255)`로 확장(`init_db()` 마이그레이션)

---

## 3. 입력 길이 제한 (취약점 #3)

`app/models/schemas.py` / `app/routers/preferences.py`

| 필드 | 제한 |
|------|------|
| `RecommendRequest.user_message` | `max_length=2000` |
| `RecommendRequest.situation` / `mood` | `max_length=200` |
| `SelectMenuRequest.food_name` | `max_length=100` |
| `RecipeRequest.food_name` | `max_length=100` |
| `DislikedFoodCreate.food` | `max_length=100` |

---

## 환경 변수 추가

`.env`에 아래 항목 추가(`.env.example` 갱신 완료):

```env
JWT_SECRET=<강력한 랜덤 값> # python -c "import secrets; print(secrets.token_hex(32))"
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24
```

> 미설정 시 개발용 기본 시크릿이 사용되며, 운영 환경에서는 반드시 교체해야 한다.

## 의존성 추가

```
PyJWT==2.10.1 # requirements.txt
```

---

## 수정 파일 목록

### 백엔드 (10개, 신규 2개 포함)

```
backend/
├── requirements.txt ← PyJWT 추가
├── .env.example ← JWT_* 추가
└── app/
    ├── config.py ← JWT_SECRET/ALGORITHM/EXPIRE_HOURS
    ├── dependencies.py ← 신규: 인증 의존성
    ├── database.py ← password_hash 컬럼 확장 마이그레이션
    ├── models/schemas.py ← AuthResponse, 입력 길이 제한
    ├── services/
    │ ├── token_service.py ← 신규: JWT 발급/검증
    │ └── auth_service.py ← 자기서술적 해시 포맷 + 하위호환
    └── routers/
        ├── auth.py ← 로그인/회원가입 시 토큰 발급
        ├── chat.py ← 토큰에서 user_id 추출
        ├── ingredients.py ← 경로 user_id 제거, 토큰 인증
        └── preferences.py ← 경로 user_id 제거, 토큰 인증
```

### 프론트엔드 (7개, 신규 1개 포함)

```
frontend/src/
├── api.js ← 신규: API_BASE + 토큰 헬퍼
├── App.jsx ← 로그아웃 시 토큰 제거, 헤더 적용
├── components/ChatPage.jsx ← authHeaders 적용
└── pages/
    ├── LoginPage.jsx ← 토큰 저장
    ├── FridgePage.jsx ← 경로/헤더 수정
    ├── HistoryPage.jsx ← 경로/헤더 수정
    └── SettingsPage.jsx ← 경로/헤더 수정
```

---

## 검증 결과 (2026-06-02)

### 백엔드 단위 검증 (모듈 import + 로직)

| 항목 | 결과 |
|------|------|
| 전체 모듈 import | O |
| JWT 발급 → 검증 라운드트립 | O |
| 위조/무효 토큰 → None | O |
| 신규 해시 생성/검증 | O |
| 구버전 2-파트 해시 하위호환 검증 | O |

### API 스모크 테스트 (실제 서버 + DB)

| 항목 | 결과 |
|------|------|
| 회원가입 → access_token 반환 | O |
| 토큰 없이 보호 엔드포인트(ingredients/history/disliked) | 401 |
| 유효 토큰으로 ingredients 조회/추가 | 200/201 |
| 위조 토큰으로 ingredients 조회 | 401 |
| 로그인 → 토큰 재발급 | O |
| 기피음식 추가/조회 | O |
| 회원 탈퇴 | O |
| 프론트엔드 `vite build` | O |

> **남은 권장 사항(ver3 /):** DB 커넥션 풀, 주요 컬럼 인덱스, 선호도 분석 역인덱스, 닉네임/비밀번호 변경 기능, 테마 DB 저장 등은 이번 범위에서 제외(후속 작업).
