# 냉털이 — 개인화 추천 시스템 개선 (ver2)

> 작성일: 2026-05-31
> 기반 버전: CHANGES.md (1~9차 수정 완료 상태)

---

## 개선 목표

사용자가 실제로 선택한 메뉴 데이터를 저장하고 분석하여 개인화된 추천을 제공합니다.

---

## 전체 동작 흐름

### 변경 전
```
사용자 입력
    ↓
AI 추천 + 레시피 동시 생성
    ↓
텍스트 응답 표시
```

### 변경 후
```
사용자 입력
    ↓
1단계: AI 메뉴 후보 추천 (레시피 없음, JSON 구조 반환)
    ↓
카드 UI로 후보 표시 (활용률·추가 재료·예상 비용 포함)
    ↓
사용자가 메뉴 카드 클릭 → "선택" 버튼 클릭
    ↓
2단계: 선택 기록 저장 (user_food_history)
    ↓
3단계: 선택한 메뉴의 레시피만 GPT가 생성
    ↓
레시피 채팅창에 표시
    ↓
다음 추천 시 → 선택 기록 분석 → 선호도 자동 반영
```

---

## 신규 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/chat/recommend` | 메뉴 후보 추천 (기존과 동일 경로, 응답 구조 변경) |
| `POST` | `/api/chat/select` | 사용자 메뉴 선택 저장 |
| `POST` | `/api/chat/recipe` | 선택된 메뉴 레시피 생성 |

### `POST /api/chat/recommend` 응답 구조 변경

**변경 전:**
```json
{
  "id": 4,
  "recommendation": "긴 텍스트 (추천 + 레시피 포함)"
}
```

**변경 후:**
```json
{
  "conversation_id": 1780215524436,
  "summary": "보유 재료를 활용해 만들 수 있는 메뉴를 추천합니다.",
  "candidates": [
    {
      "name": "계란볶음밥",
      "reason": "보유 재료만으로 완성 가능한 간단한 한 끼입니다.",
      "usage_rate": 100,
      "missing_ingredients": [],
      "extra_cost": 0
    },
    {
      "name": "김치찌개",
      "reason": "김치와 돼지고기를 활용한 든든한 메뉴입니다.",
      "usage_rate": 75,
      "missing_ingredients": [
        {"name": "두부", "cost": 2000}
      ],
      "extra_cost": 2000
    }
  ]
}
```

### `POST /api/chat/select` 요청
```json
{
  "user_id": 3,
  "food_name": "계란볶음밥",
  "conversation_id": 1780215524436
}
```

### `POST /api/chat/recipe` 요청 / 응답
```json
// 요청
{
  "user_id": 3,
  "food_name": "계란볶음밥",
  "conversation_id": 1780215524436,
  "ingredients": []
}

// 응답
{
  "food_name": "계란볶음밥",
  "recipe": "[재료]\n...\n[조리 순서]\n1. ..."
}
```

---

## 신규 DB 테이블

```sql
CREATE TABLE user_food_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id BIGINT,
    food_name VARCHAR(100) NOT NULL,
    selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- 사용자가 선택한 메뉴를 시간 순으로 저장
- `conversation_id` 함께 저장 → 어떤 추천 결과에서 어떤 메뉴를 선택했는지 추적 가능
- `user_id` 기반 선호도 분석에 활용
- 회원 탈퇴 시 CASCADE 자동 삭제
- 기존 DB 대응: `init_db()` 실행 시 `ALTER TABLE ADD COLUMN IF NOT EXISTS`로 자동 마이그레이션

---

## 수정 파일 목록

### 백엔드

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `app/models/schemas.py` | 수정 | `MissingIngredient`, `MenuCandidate`, `MenuRecommendResponse`, `SelectMenuRequest`, `RecipeRequest`, `RecipeResponse` 추가 |
| `app/database.py` | 수정 | `user_food_history` 테이블 추가, `save_food_history()`, `get_food_history()` 함수 추가 |
| `app/services/ai_service.py` | 수정 | `get_menu_candidates()` 추가 (JSON 모드 OpenAI 호출) |
| `app/services/prompt_service.py` | 수정 | `build_menu_recommendation_prompt()`, `build_recipe_prompt()` 추가. 기존 `build_meal_prompt()` 유지 |
| `app/services/preference_service.py` | **신규** | 선호도 분석 서비스 (카테고리 매핑 기반) |
| `app/routers/chat.py` | 수정 | `/recommend` 응답 구조 변경, `/select`·`/recipe` 엔드포인트 추가 |

### 프론트엔드

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `src/components/ChatPage.jsx` | 수정 | 2단계 흐름으로 전환, 메뉴 선택 카드 UI 추가, `handleSelectMenu()` 구현 |

---

## 선호도 분석 시스템 (`preference_service.py`)

### 카테고리 구성

| 카테고리 | 한국어 레이블 | 예시 음식 |
|----------|--------------|-----------|
| `spicy` | 매운 음식 | 제육볶음, 떡볶이, 닭갈비, 부대찌개 |
| `soup` | 국물 음식 | 김치찌개, 된장찌개, 순두부찌개, 라면 |
| `high_protein` | 고단백 음식 | 닭가슴살, 삼겹살, 불고기, 참치 |
| `korean` | 한식 | 비빔밥, 불고기, 잡채, 파전 |
| `quick` | 간단한 요리 | 계란볶음밥, 라면, 주먹밥, 토스트 |
| `healthy` | 건강식 | 샐러드, 두부조림, 나물비빔밥 |

### 분석 로직

```
선택 기록 30개 → 카테고리별 매칭 카운트 → 비율 계산
선호도 비율 ≥ 20% → 해당 카테고리를 "선호"로 판정
→ 프롬프트에 삽입 → GPT가 추천 시 반영
```

### 프롬프트 반영 예시

```
[사용자 선호 정보]
- 매운 음식 선호
- 한식 선호
위 선호도를 추천 시 우선적으로 반영해.
```

---

## 프론트엔드 메뉴 선택 카드 UI

### 카드 구성 요소

```
┌──────────────────────────────────────────┐
│ 보유 재료를 활용해 만들 수 있는 메뉴입니다. │ ← summary
│ │
│ 아래 메뉴 중 원하시는 것을 선택해주세요! │
│ │
│ ┌────────────────────────────────────┐ │
│ │ 계란볶음밥 100% │ │ ← 활용률 색상 구분
│ │ 보유 재료만으로 만들 수 있어요. │ │ ← reason
│ │ 추가 재료 없음! │ │
│ │ 추가 비용 없음 │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │ 계란볶음밥 선택 │ │ │ ← 선택 버튼
│ │ └──────────────────────────────┘ │ │
│ └────────────────────────────────────┘ │
│ │
│ ┌────────────────────────────────────┐ │
│ │ 김치찌개 75% │ │
│ │ ... │ │
│ └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### 활용률 색상 기준

| 범위 | 색상 | 의미 |
|------|------|------|
| 80% 이상 | 초록 | 보유 재료로 거의 완성 가능 |
| 50~79% | 노랑 | 일부 재료 추가 필요 |
| 50% 미만 | 빨강 | 재료 추가 구매 필요 |

### 선택 후 상태

- 선택한 카드: 빨간 테두리 + "선택 완료 — 레시피를 준비하고 있습니다..."
- 나머지 카드: 흐리게(opacity 0.45) 처리
- 레시피가 새 AI 메시지로 채팅창에 표시

---

## 기존 기능 유지 확인

| 기능 | 유지 여부 | 비고 |
|------|-----------|------|
| 회원가입 / 로그인 | O | 변경 없음 |
| 냉장고 재료 관리 | O | 추천 시 자동 로드 유지 |
| 기피 음식 및 알러지 필터링 | O | 추천 프롬프트에 절대 제외 조건 유지 |
| chat_logs 저장 | O | `/recommend`, `/recipe` 모두 저장 |
| 추천 기록 히스토리 | O | 텍스트 fallback으로 히스토리 표시 |
| 다크모드 | O | CSS 변수 유지 |
| 선호도 분석 | O | 신규 — 선택 기록 누적 시 자동 반영 |

---

## 주요 설계 결정

### 1. 추천 단계에서 JSON 모드 사용

OpenAI `response_format={"type": "json_object"}` 적용으로 구조화된 데이터 보장.
파싱 실패 시 `{"candidates": [], "summary": "..."}` fallback 반환.

### 2. 레시피는 기존 텍스트 모드 유지

레시피는 마크다운 스타일 포맷이 자유로운 텍스트 응답이 더 적합하므로 기존 `get_ai_recommendation()` 재활용.

### 3. 선택 저장 성공 확인 후 레시피 생성

`user_food_history`는 선호도 분석의 핵심 데이터이므로 저장 실패 시 데이터 유실을 방지하기 위해 순차 처리합니다.

```
사용자 메뉴 선택
    ↓
POST /api/chat/select → 저장 성공 확인
    ↓ (실패 시 오류 메시지 표시 후 중단)
POST /api/chat/recipe → 레시피 생성
```

저장 실패 시 오류 메시지를 표시하고, 선택 상태를 초기화하여 재시도 가능하게 합니다.

### 4. 히스토리 호환성

recommendation 타입 메시지에 `text` 필드(텍스트 요약)를 함께 포함하여 기존 HistoryPage 렌더링과 호환 유지.

### 5. chat_logs 저장 유지

`/recommend` → 추천 요약 텍스트 저장
`/recipe` → 레시피 전문 저장
기존 히스토리 조회 API(`GET /history/{user_id}`) 변경 없음.

---

## 테스트 결과 (2026-05-31)

### API 테스트 결과 (Python urllib 직접 호출)

| 항목 | 결과 |
|------|------|
| 헬스체크 | O |
| 회원가입 / 로그인 | O |
| 냉장고 재료 CRUD | O |
| 기피음식 CRUD | O |
| `POST /api/chat/recommend` — JSON candidates 반환 | 15.8초 |
| `POST /api/chat/select` — conversation_id 포함 저장 | O |
| `POST /api/chat/recipe` — 레시피 생성 | 18.6초 |
| `GET /api/chat/history` — 조회 | 4건 |
| 선호도 반영 재추천 — 매운 음식 3회 선택 후 reason에 "매운" 자동 반영 | O |
| 게스트 select (user_id=None) — DB 저장 없이 200 OK | O |
| 게스트 recipe — 레시피 정상 생성 | O |

### UI 테스트 결과 (Playwright headless Chrome)

**22/24 통과**

| 항목 | 결과 |
|------|------|
| 로그인 / 홈 진입 | O |
| 메뉴 추천 카드 표시 (활용률 뱃지, 비용 정보) | O |
| 메뉴 선택 → 카드 하이라이트 → 버튼 제거 → 흐리기 처리 | O |
| 레시피 생성 및 채팅창 표시 | O |
| 냉장고 재료 빈 상태 | O |
| 설정 — 실제 이메일·닉네임 표시 | O |
| 다크모드 / 라이트모드 전환 | O |
| 기피음식 추가 태그 표시 | O |
| 기피음식 적용 채팅 | O |
| 추천 기록 표시 | O |
| 로그아웃 → 로그인 화면 복귀 | O |
| 게스트 설정 분기 (로그인 버튼, 계정설정 숨김, AI스타일 표시) | O |
| 게스트 채팅 메뉴 카드 | O |

### 발견 및 수정 사항

**CORS 포트 누락 → 수정 완료**

Vite dev server가 5173 포트 점유 시 5174로 자동 전환되는데, `main.py` CORS origins에 5174가 없어 모든 API 요청이 차단됨. 테스트 중 발견하여 즉시 수정.

```python
# backend/main.py 수정 전
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

# 수정 후
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174", # 추가
    "http://127.0.0.1:5174", # 추가
]
```

**냉장고 재료 추가 한글 IME 테스트 제약 (앱 버그 아님)**

Playwright headless 환경에서 한글 문자 입력 시 React `onChange`가 트리거되지 않는 테스트 도구 한계. 실제 API 레벨에서는 한글 재료 추가 정상 동작 확인.
