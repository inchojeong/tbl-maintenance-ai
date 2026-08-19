# 10. API 명세

Base URL: `http://localhost:8000`  
공통 Header: `Content-Type: application/json`  
공통 오류 본문: `{ "detail": "message", "code": "ERROR_CODE" }`

---

## POST /api/query

| 항목 | 내용 |
|---|---|
| 목적 | 텍스트 정비 질의 분석 |
| Header | Content-Type: application/json |
| Path/Query | 없음 |
| Body | `{ "aircraft_id": "DEMO-KUH-01", "query": "엔진 오일 압력이 낮고 경고등이 점등되었어.", "demo_mode": false }` |
| Response | DiagnosisResult |
| 성공 | 200 |
| 오류 | 400 VALIDATION_ERROR, 503 LLM_UNAVAILABLE(→서버가 demo로 200 반환 가능), 500 |
| FE 호출 | AIQueryPanel → diagnosisStore.submitQuery |

**Pydantic**

```python
class QueryRequest(BaseModel):
    aircraft_id: str
    query: str = Field(min_length=2, max_length=500)
    demo_mode: bool = False

class DiagnosisResult(BaseModel):
    system_code: Literal["ENGINE_OIL","ENGINE_COOLING","LANDING_GEAR","MAIN_ROTOR","UNKNOWN"]
    symptom_code: str
    risk_level: Literal["LOW","MEDIUM","HIGH"]
    suspected_components: list[str]
    answer: str
    manual_ids: list[str]
    recommended_steps: list[str]
    view_target_id: str
    confidence: float
    is_demo: bool
```

**샘플 응답:** 문서 `08` JSON 스키마와 동일.

---

## POST /api/query/voice

| 항목 | 내용 |
|---|---|
| 목적 | 음성 → 텍스트 → 동일 파이프라인 |
| Header | multipart/form-data |
| Body | file: audio/*, aircraft_id, demo_mode |
| Response | DiagnosisResult (+ optional transcript) |
| 성공 | 200 |
| 오류 | 400, 503 WHISPER_UNAVAILABLE |
| FE | AIQueryPanel 음성 버튼 (P1) |

---

## POST /api/query/image

| 항목 | 내용 |
|---|---|
| 목적 | 사진 분석(시연은 고정 매핑 허용) |
| Header | multipart/form-data |
| Body | file: image/*, aircraft_id, caption? |
| Response | DiagnosisResult |
| 성공 | 200 |
| 오류 | 400, 503 |
| FE | AIQueryPanel 사진 버튼 (P1) |

---

## GET /api/manual/search

| 항목 | 내용 |
|---|---|
| 목적 | 교범 검색 |
| Query | `q`, `system_code?`, `top_k=5` |
| Response | `{ "items": [ ManualChunk... ] }` |
| 성공 | 200 |
| 오류 | 400 |
| FE | ManualPanel |

**ManualChunk:** id, title, chapter, section, page, content, system_code, is_dummy, score?

---

## GET /api/failures/search

| 항목 | 내용 |
|---|---|
| 목적 | 유사 고장사례 |
| Query | `q?`, `symptom_code?`, `top_k=5` |
| Response | `{ "items": [ FailureCase... ] }` |
| FE | FailureCasePanel |

---

## GET /api/phm/{aircraft_id}

| 항목 | 내용 |
|---|---|
| 목적 | PHM 더미 조회 |
| Path | aircraft_id |
| Response | PhmStatus |
| 오류 | 404 AIRCRAFT_NOT_FOUND |
| FE | PHMPanel |

---

## GET /api/3d/map/{view_target_id}

| 항목 | 내용 |
|---|---|
| 목적 | viewTarget 매핑 조회(FE JSON과 동일 소스) |
| Path | view_target_id |
| Response | ViewTargetConfig |
| 오류 | 404 VIEW_TARGET_NOT_FOUND |
| FE | useThreeStore.applyViewTarget (캐시 우선, API는 동기화용) |

---

## POST /api/maintenance/result

| 항목 | 내용 |
|---|---|
| 목적 | 정비결과 저장 |
| Body | `{ "aircraft_id", "query_id?", "actions", "parts_used?", "outcome" }` |
| Response | `{ "id": "MR-...", "saved": true }` |
| 성공 | 201 |
| 오류 | 400 |
| FE | MaintenanceHistoryPanel / SCR-11 |

---

## POST /api/demo/reset

| 항목 | 내용 |
|---|---|
| 목적 | 시연 상태·임시 이력 초기화 |
| Body | `{ "aircraft_id": "DEMO-KUH-01" }` (optional) |
| Response | `{ "ok": true }` |
| 성공 | 200 |
| FE | DemoControlPanel |

---

## 오류 코드 목록

| code | HTTP | message |
|---|---|---|
| VALIDATION_ERROR | 400 | 요청 형식이 올바르지 않습니다. |
| AIRCRAFT_NOT_FOUND | 404 | 항공기를 찾을 수 없습니다. |
| VIEW_TARGET_NOT_FOUND | 404 | view_target_id가 없습니다. |
| LLM_UNAVAILABLE | 503 | LLM 호출 실패(서버가 demo로 강등할 수 있음) |
| WHISPER_UNAVAILABLE | 503 | 음성 인식 불가 |
| INTERNAL_ERROR | 500 | 서버 오류 |
