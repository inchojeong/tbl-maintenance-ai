# 08. AI 및 RAG 설계

## 1. 질의 분석 파이프라인

```text
1) Input normalize (trim, 길이 제한 500자)
2) Demo mode? → demoResponses match → return
3) Rule assist (키워드로 system/symptom 후보)
4) Embedding + Chroma metadata filter (system_code)
5) Top-k manuals + failures + phm 조회
6) LLM Structured Output (허용 코드 목록 주입)
7) Pydantic validate + view_target_id whitelist
8) 실패 시 fallback demo / UNKNOWN
```

## 2. 코드 분류 체계

### system_code

`ENGINE_OIL` | `ENGINE_COOLING` | `LANDING_GEAR` | `MAIN_ROTOR` | `UNKNOWN`

### symptom_code (대표)

| code | 설명 |
|---|---|
| LOW_OIL_PRESSURE | 오일 압력 저하 |
| OIL_WARNING_LIGHT | 오일 경고등 |
| OIL_LEAK | 누유 |
| LG_NOT_DEPLOY | 랜딩기어 미전개 |
| ROTOR_VIBRATION | 로터 진동 |

### component_code

`OIL_FILTER` | `OIL_PUMP` | `PRESSURE_SENSOR` | `ACCESS_PANEL` | `UNKNOWN`

## 3. 교범 문단 분할

- 단위: 점검 절차 1주제 = 1 chunk (200~800자)
- 메타: document_id, title, chapter, section, page, system_code, symptom_codes[], component_codes[], is_dummy
- PDF 사용 시 PyMuPDF → 수작업 메타 보정(시제품은 JSON 시드 우선)

## 4. ChromaDB Collection

| 항목 | 값 |
|---|---|
| name | `dummy_manuals` |
| id | document paragraph id |
| document | content text |
| metadata | 상기 메타 + language=`ko` |

필터 예: `{"system_code": "ENGINE_OIL"}`  
유사도: cosine, top_k=3~5

## 5. LLM 프롬프트 구조

```text
System:
- 당신은 시연용 항공기 정비 어시스턴트다.
- 제공된 교범 발췌만 근거로 답한다.
- 허용 system/symptom/component/view_target 목록 외 값을 만들지 않는다.
- 실제 군 교범·부품번호·비행가능 판정을 단정하지 않는다.
- JSON만 출력한다.

User:
- query
- candidate manuals[]
- failures[]
- phm
- allowed_view_targets[]
```

## 6. Hallucination 제한

1. view_target_id ∈ whitelist
2. manual_ids ⊆ 검색 결과
3. 수치(psi 등)는 PHM/교범에 있을 때만
4. 검색 0건 → answer에 근거 부족 명시, risk는 MEDIUM 이하 권고, view_target=`AIRCRAFT_OVERVIEW` 또는 UNKNOWN 처리

## 7. Fallback

| 조건 | 동작 |
|---|---|
| demoMode=true | 고정 JSON |
| LLM timeout/4xx/5xx | 키워드 매칭 demo |
| validation fail | 1회 repair prompt 후 demo |
| RAG empty | 근거없음 템플릿 |

## 8. 최종 JSON 스키마 (필수 필드)

```json
{
  "system_code": "ENGINE_OIL",
  "symptom_code": "LOW_OIL_PRESSURE",
  "risk_level": "HIGH",
  "suspected_components": ["OIL_FILTER", "OIL_PUMP", "PRESSURE_SENSOR"],
  "answer": "엔진 오일 압력 저하로 판단됩니다. 더미 교범에 따라 오일 필터를 우선 점검하십시오.",
  "manual_ids": ["DUMMY-TM-ENG-03-P15"],
  "recommended_steps": [
    "안전조치 및 경고계통 확인",
    "오일 레벨·누유 육안점검",
    "오일 필터 차압 확인 및 교체",
    "지상가동 후 압력 회복 확인",
    "정비결과 등록"
  ],
  "view_target_id": "ENGINE_OIL_SYSTEM",
  "confidence": 0.91,
  "is_demo": false
}
```

Pydantic 예: `backend/app/schemas/diagnosis.example.py`

## 9. 음성·이미지 (P1)

- Voice: Whisper → text → 동일 `/api/query` 파이프라인
- Image: 시연용 고정 매핑(“필터 오염 사진” → OIL_FILTER 시나리오) 우선, 실 Vision은 선택
