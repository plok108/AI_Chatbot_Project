# 냉털이 — 상황 인식 정밀화 + 알러지 다층 방어 + 상세 레시피 + 리팩토링 (ver6)

> 작성일: 2026-06-02
> 기반 버전: CHANGES_ver5.md (하이브리드 추천 파이프라인 완료 상태)
> 범위: 백엔드 + 프론트엔드 + 코드 리팩토링

---

## 목차

1. [배경](#배경)
2. [Part 1 — 디바이스 시간 사용](#part-1--디바이스-시간-사용)
3. [Part 2 — 사용자 수동 날씨 입력](#part-2--사용자-수동-날씨-입력)
4. [Part 3 — 알러지 다층 방어](#part-3--알러지-다층-방어)
5. [Part 4 — 상세 레시피](#part-4--상세-레시피)
6. [Part 5 — 하드코딩 제거 리팩토링](#part-5--하드코딩-제거-리팩토링)
7. [수정 파일 목록](#수정-파일-목록)
8. [검증 결과](#검증-결과)

---

## 배경

ver5의 상황 인식과 안전 필터에는 세 가지 한계가 있었다.

- 시간을 **서버 시각**으로 판단 → 클라우드(UTC) 배포 시 시간대 어긋남
- 날씨를 받을 방법이 없었음
- 안전 필터가 후보 **이름만** 검사 → 숨은 양념(새우젓 등)을 놓침

또한 레시피가 다소 간단했다. ver6에서 이를 보강하고, 늘어난 코드의 **매직 넘버를 정리**했다.

---

## Part 1 — 디바이스 시간 사용

- 브라우저가 자신의 로컬 시각을 보내 서버가 그대로 사용 → 서버가 UTC여도 정확.

| 파일 | 변경 |
|------|------|
| `app/models/schemas.py` | `RecommendRequest.client_hour: Optional[int]`(0~23) 추가 |
| `app/services/context_service.py` | `get_context(hour=...)` 인자 우선, 없으면 서버 시각 폴백 |
| `app/routers/chat.py` | `get_context(hour=request.client_hour, ...)` 전달 |
| `src/components/ChatPage.jsx` | 추천 요청에 `client_hour: new Date().getHours()` 전송 |

---

## Part 2 — 사용자 수동 날씨 입력

- 자동 날씨 API 대신 **사용자가 직접 날씨를 선택**(원 취지에 맞춤). 무료 API는 키를 넣으면 자동 동작하도록 옵션으로 유지.

| 파일 | 변경 |
|------|------|
| `app/models/schemas.py` | `weather_feel`("cold"/"normal"/"hot"), `weather_wet`(비·눈) 추가 |
| `app/services/context_service.py` | 수동 입력 → `is_cold/is_hot/is_rainy` 변환(`_manual_weather`). 수동 없고 키 있으면 API |
| `app/routers/chat.py` | 날씨 입력값을 `get_context`에 전달 |
| `src/components/ChatPage.jsx` | 입력창 위 날씨 선택 UI(추움/보통/더움 + 비·눈 토글) |

> `scoring_service`는 이미 `is_cold/is_hot/is_rainy`를 읽으므로 수정 불필요(수동·API 동일하게 처리).

---

## Part 3 — 알러지 다층 방어

이름만 검사하던 안전 필터를 **여러 겹**으로 강화. (의학적 안전을 보장하지는 않으며 면책 명시)

### (가) GPT가 재료를 펼치게 함
- `prompt_service.py`: 추천 JSON에 후보별 `ingredients`(양념·젓갈 포함 전체 재료) 항목 요구.
- `schemas.py`: `MenuCandidate.ingredients` 추가.

### (나) 코드가 재료 목록까지 검사
- `safety_service.candidate_haystack`에 후보의 `ingredients` 포함 → 이름뿐 아니라 속 재료까지 검사.

### (다) 숨은 양념 규칙표
- `safety_service.SEASONING_ALLERGENS` 신설(약 25개):
  예) `새우젓→[새우,갑각류]`, `액젓→[생선,갑각류]`, `굴소스→[굴,조개]`, `마요네즈→[계란]`, `버터/치즈→[유제품]`.
  재료 목록에 양념어가 보이면 함의된 알러지원을 사용자 기피 목록과 대조해 차단.

### (라) "애매하면 알린다" + 면책
- 재료 정보가 전혀 없어 검증 불가하면 제거하지 않되 `safety_note` 경고를 붙임.
- `schemas.py`: `MenuCandidate.safety_note` 추가.
- `src/components/ChatPage.jsx`: 카드에 재료·경고 표시 + 면책 문구
  ("알러지 안전을 완벽히 보장하지 않습니다. 드시기 전 재료를 꼭 확인하세요.").

**예시:** 갑각류 알러지 사용자에게 GPT가 `김치찌개(재료: …, 새우젓)`을 추천하면,
이름엔 새우가 없어도 (다) 규칙표가 새우젓→갑각류로 잡아 제거.

---

## Part 4 — 상세 레시피

- `prompt_service.build_recipe_prompt`의 출력 형식을 대폭 확장:
  기본 정보(인분·난이도·시간) / **정확한 분량의 재료** / 사전 준비 /
  **단계별 불 세기·시간** / 대체 재료 / 맛 조절 팁 / 자주 하는 실수 / 플레이팅·보관.
- 프론트는 `white-space: pre-wrap`이라 길어진 레시피가 그대로 표시됨(수정 불필요).

---

## Part 5 — 하드코딩 제거 리팩토링

대학생 수준에서 읽기 쉽도록, 흩어진 매직 넘버를 **이름 있는 상수**로 정리(동작은 동일).

| 파일 | 변경 |
|------|------|
| `app/services/scoring_service.py` | `SCORE_MATCH/NEUTRAL/MISMATCH`, `COST_ZERO_AT_WON`, `COLD/HOT/LATE_*_FAVORS` 상수화. `_favored_categories()`로 상황 점수 로직 분리. `rank_candidates` 정렬을 튜플 트릭 → 의미 있는 dict로 가독성 개선 |
| `app/services/context_service.py` | 시간대 경계(`MORNING_START` 등), 온도 임계값(`COLD_TEMP_C`, `HOT_TEMP_C`), 비/눈 조건(`RAINY_CONDITIONS`), API URL·타임아웃을 상수화 |
| `app/services/safety_service.py` | 경고 문구를 `UNVERIFIABLE_WARNING` 상수로 분리 |

### Part 5-2 — 죽은 코드 제거 + 함수 분리 (추가 정리)

기능 변경 없이 안 쓰는 코드를 지우고, 긴 함수의 중복을 작은 헬퍼로 나눴다.

| 대상 | 변경 |
|------|------|
| `app/models/schemas.py` | 어디서도 안 쓰는 `RecommendResponse` 클래스 삭제 |
| `app/services/prompt_service.py` | ver2 이후 호출처가 없는 `build_meal_prompt`(약 70줄) 삭제 |
| `src/App.jsx` | 사용되지 않는 상태 7개(`ingredients/situation/mood/userMessage/result/savedId/loading`)와 `startNewConversation` 내부의 불필요한 초기화 제거 |
| `app/routers/chat.py` | 중복 로직을 이름 있는 헬퍼로 분리: `_resolve_ingredients()`(재료 DB 폴백, recommend·recipe 공용), `_collect_disliked_foods()`(요청+DB 합치기), `_candidate_ingredients()`, `_to_menu_candidates()`(dict→응답 객체). "응답 구성"부가 15줄 → 1줄로 축소 |

> 의도적으로 남긴 것: `database.py`의 명시적 연결 패턴(초보자가 읽기 더 쉬움), React 인라인 스타일(프로젝트 일관성).

---

## 수정 파일 목록

### 백엔드
```
app/
├── models/schemas.py ← client_hour, weather_feel/wet, ingredients, safety_note + RecommendResponse 삭제
├── services/
│ ├── context_service.py ← 디바이스 시간·수동 날씨 + 상수화
│ ├── safety_service.py ← 재료 검사 + 양념 규칙표 + 경고 상수
│ ├── scoring_service.py ← 매직 넘버 상수화·가독성 리팩토링
│ └── prompt_service.py ← 재료 요구(Part3) + 상세 레시피(Part4) + build_meal_prompt 삭제
└── routers/chat.py ← 컨텍스트 인자 전달, ingredients/safety_note 구성 + 공통 헬퍼 분리
```

### 프론트엔드
```
src/App.jsx ← 미사용 상태 7개 제거(정리)
src/components/ChatPage.jsx ← client_hour 전송, 날씨 선택 UI, 재료·경고·면책 표시
```

> 응답 스키마는 필드 "추가"만 하므로 기존 화면과 하위호환. 죽은 코드 제거·헬퍼 분리는 동작 변화 없음.

---

## 검증 결과

| 항목 | 결과 |
|------|------|
| 단위: 새우젓→갑각류 제거, 마요네즈→계란 제거 | O |
| 단위: 재료 없음 + 알러지 → 경고(safety_note) | O |
| 단위: 디바이스 시간(23시→야식), 수동 날씨(추움+비) | O |
| 리팩토링 후 점수 동일성(김치찌개 92, 계란말이 69, 비용 60/100/0) | O |
| 죽은 코드 제거·헬퍼 분리 후 import·헬퍼 동작·라우트 19개 | O |
| App.jsx 미사용 상태 제거 후 `vite build` | O |
| 실제 GPT 추천 종단 호출(시간·날씨·재료 필드) | 200 |
| 실제 레시피 호출(6개 상세 섹션) | O |
| 프론트 `vite build` / 서버 부팅 | O |

> 안전 필터는 "위험 감소 + 사용자 확인"이며 의학적 안전을 보장하지 않는다(UI·논문에 명시).
