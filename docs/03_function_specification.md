# 03. 기능명세서

표기: 우선순위 P0=필수, P1=권장, P2=제외후보. 난이도 L/M/H. 공수는 인일(MD).

---

## F-01 텍스트 질의 입력

| 항목 | 내용 |
|---|---|
| 기능 ID | F-01 |
| 기능명 | 텍스트 질의 입력 |
| 설명 | 정비사가 증상 문장을 입력·전송 |
| 입력 | `query: string`, `aircraft_id` |
| 처리 | 유효성 검사 → `POST /api/query` |
| 출력 | 채팅 버블(user) + 로딩 |
| 적용 기술 | React, Zustand, Axios |
| 관련 화면 | SCR-01, SCR-02 |
| 우선순위 | P0 |
| 난이도 | L |
| 공수 | 1 |
| 선행 | FE 스캐폴딩 |
| 완료 조건 | Enter/전송으로 API 호출 |

## F-02 질의 구조화(LLM)

| 항목 | 내용 |
|---|---|
| 기능 ID | F-02 |
| 기능명 | 질의 분석·코드 분류 |
| 설명 | 계통/증상/위험/부품/view_target 구조화 |
| 입력 | 자연어 질의 |
| 처리 | LLM Structured Output + Pydantic |
| 출력 | `DiagnosisResult` JSON |
| 적용 기술 | FastAPI, OpenAI, Pydantic |
| 관련 화면 | SCR-02, SCR-03 |
| 우선순위 | P0 |
| 난이도 | M |
| 공수 | 3 |
| 선행 | 스키마·허용 코드 테이블 |
| 완료 조건 | 대표 질의 → `ENGINE_OIL`/`LOW_OIL_PRESSURE`/`HIGH`/`OIL_FILTER`/`ENGINE_OIL_SYSTEM` |

## F-03 더미 교범 RAG

| 항목 | 내용 |
|---|---|
| 기능 ID | F-03 |
| 기능명 | 교범 검색 |
| 설명 | system_code 필터 + 유사도 검색 |
| 입력 | query, system_code, symptom_code |
| 처리 | ChromaDB query → top-k |
| 출력 | `manual_ids`, 문단, 장·절·페이지 |
| 적용 기술 | ChromaDB, Embedding |
| 관련 화면 | SCR-08, Bottom Manual |
| 우선순위 | P0 |
| 난이도 | M |
| 공수 | 4 |
| 선행 | 더미 교범 20~30문단 |
| 완료 조건 | 오일압력 질의에 DUMMY-TM-ENG-03 계열 반환 |

## F-04 유사 고장사례 검색

| 항목 | 내용 |
|---|---|
| 기능 ID | F-04 |
| 기능명 | 유사 고장 검색 |
| 설명 | 증상 유사 사례 표시 |
| 입력 | symptom_code / query |
| 처리 | `GET /api/failures/search` |
| 출력 | 유사도·원인·조치 |
| 적용 기술 | SQLite/JSON |
| 관련 화면 | SCR-08 하단 Failure |
| 우선순위 | P0 |
| 난이도 | L |
| 공수 | 1.5 |
| 선행 | failure 시드 |
| 완료 조건 | 유사도 상위 사례 ≥1 |

## F-05 PHM 조회

| 항목 | 내용 |
|---|---|
| 기능 ID | F-05 |
| 기능명 | PHM 더미 상태 |
| 설명 | 오일압력 등 모의 센서 |
| 입력 | `aircraft_id` |
| 처리 | `GET /api/phm/{aircraft_id}` |
| 출력 | psi, temp, health_score, is_dummy |
| 적용 기술 | FastAPI, JSON |
| 관련 화면 | SCR-09 |
| 우선순위 | P0 |
| 난이도 | L |
| 공수 | 1 |
| 선행 | phm_demo 데이터 |
| 완료 조건 | 고지 문구와 함께 표시 |

## F-06 3D 기체 표시

| 항목 | 내용 |
|---|---|
| 기능 ID | F-06 |
| 기능명 | 항공기 3D 표시 |
| 설명 | GLB 로드 및 궤도 조작 |
| 입력 | GLB URL |
| 처리 | useGLTF + Canvas |
| 출력 | 렌더된 장면 |
| 적용 기술 | R3F, Drei |
| 관련 화면 | SCR-01 |
| 우선순위 | P0 |
| 난이도 | M |
| 공수 | 3 |
| 선행 | GLB(또는 프록시) |
| 완료 조건 | 회전/줌 가능, 로딩 실패 시 폴백 UI |

## F-07 구역 하이라이트·클릭 이동

| 항목 | 내용 |
|---|---|
| 기능 ID | F-07 |
| 기능명 | 접근 구역 표시 및 이동 |
| 설명 | AI 결과 구역 강조 후 클릭 시 카메라 이동 |
| 입력 | `view_target_id` |
| 처리 | viewTargets 매핑 + GSAP |
| 출력 | 카메라/하이라이트 상태 |
| 적용 기술 | GSAP, R3F raycast |
| 관련 화면 | SCR-03, SCR-04 |
| 우선순위 | P0 |
| 난이도 | H |
| 공수 | 5 |
| 선행 | F-06, viewTargets.json |
| 완료 조건 | ENGINE_OIL_SYSTEM 표시→클릭→확대 |

## F-08 패널 개방·투명화

| 항목 | 내용 |
|---|---|
| 기능 ID | F-08 |
| 기능명 | 접근패널/X-Ray |
| 설명 | 패널 hide/이동, 외피 opacity |
| 입력 | hideObjects, transparentObjects |
| 처리 | XRayController, 패널 애니 |
| 출력 | 내부 부품 가시화 |
| 적용 기술 | Three.js material, GSAP |
| 관련 화면 | SCR-05, SCR-06 |
| 우선순위 | P0 |
| 난이도 | H |
| 공수 | 4 |
| 선행 | 분리된 메시 명명 |
| 완료 조건 | ENGINE_PANEL_LEFT 제거/이동 + BODY 투명 |

## F-09 부품 하이라이트

| 항목 | 내용 |
|---|---|
| 기능 ID | F-09 |
| 기능명 | 점검 부품 하이라이트 |
| 설명 | OIL_FILTER 등 emissive/색 강조 |
| 입력 | highlightObjects[] |
| 처리 | HighlightController |
| 출력 | 강조된 메시 |
| 적용 기술 | Three.js |
| 관련 화면 | SCR-07 |
| 우선순위 | P0 |
| 난이도 | M |
| 공수 | 2 |
| 선행 | F-08 |
| 완료 조건 | OIL_FILTER 시각적 구분 |

## F-10 정비 가이드 연동

| 항목 | 내용 |
|---|---|
| 기능 ID | F-10 |
| 기능명 | 가이드 단계↔3D |
| 설명 | 단계 선택 시 viewTarget 전환 |
| 입력 | guideStep index |
| 처리 | Zustand setViewTarget |
| 출력 | 단계별 장면 |
| 적용 기술 | Zustand, viewTargets |
| 관련 화면 | SCR-10 |
| 우선순위 | P0 |
| 난이도 | M |
| 공수 | 2 |
| 선행 | F-07~F-09 |
| 완료 조건 | 필터 단계에서 ENGINE_OIL_FILTER |

## F-11 정비결과 등록

| 항목 | 내용 |
|---|---|
| 기능 ID | F-11 |
| 기능명 | 정비결과 저장 |
| 설명 | 조치 결과 로컬 저장 |
| 입력 | aircraft_id, actions, parts |
| 처리 | `POST /api/maintenance/result` |
| 출력 | saved id |
| 적용 기술 | SQLite |
| 관련 화면 | SCR-11 |
| 우선순위 | P0 |
| 난이도 | L |
| 공수 | 1.5 |
| 선행 | DB 스키마 |
| 완료 조건 | 이력 탭에 표시 |

## F-12 데모모드·초기화

| 항목 | 내용 |
|---|---|
| 기능 ID | F-12 |
| 기능명 | 데모모드 / Reset |
| 설명 | API 장애 시 고정 응답, 상태 초기화 |
| 입력 | demo flag, reset |
| 처리 | 키워드 매칭 / `POST /api/demo/reset` |
| 출력 | 동일 시연 JSON, 초기 장면 |
| 적용 기술 | JSON cache, Zustand |
| 관련 화면 | SCR-12 |
| 우선순위 | P0 |
| 난이도 | M |
| 공수 | 2 |
| 선행 | demoResponses |
| 완료 조건 | 네트워크 차단 시에도 대표 시나리오 완주 |

## F-21~F-28 권장 (요약)

| ID | 명 | 공수 | 우선 |
|---|---|---:|---|
| F-21 | 음성 질의 | 2 | P1 |
| F-22 | 사진 질의 | 2 | P1 |
| F-23 | 패널 분리 애니 | 2 | P1 |
| F-24 | Outline/점멸 | 1.5 | P1 |
| F-25 | 접근경로 라인 | 2 | P1 |
| F-26 | 단계 체크 | 1 | P1 |
| F-27 | 데모 리셋 UX | 0.5 | P1 |
| F-28 | 저사양 프리셋 | 1.5 | P1 |

## 기능↔화면↔API 매트릭스

| 기능 | 화면 | API |
|---|---|---|
| F-01,F-02 | SCR-02 | POST /api/query |
| F-03 | SCR-08 | GET /api/manual/search |
| F-04 | Failure 탭 | GET /api/failures/search |
| F-05 | SCR-09 | GET /api/phm/{id} |
| F-07~F-09 | SCR-03~07 | GET /api/3d/map/{id} |
| F-11 | SCR-11 | POST /api/maintenance/result |
| F-12 | SCR-12 | POST /api/demo/reset |
| F-21 | SCR-02 | POST /api/query/voice |
| F-22 | SCR-02 | POST /api/query/image |
