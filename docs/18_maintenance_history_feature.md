# 정비이력 관리 · 유사사례 활용 기능

> PROTOTYPE DEMO — 가상 정비이력 데이터입니다. 실제 군 정비자료·DELIIS·실기체 데이터가 아닙니다.

## 1. 변경 파일 목록

### Backend
| 경로 | 역할 |
|---|---|
| `backend/app/schemas/maintenance.py` | 항공기·정비이력·유사검색 Pydantic 스키마 |
| `backend/app/services/maintenance_history_service.py` | DB 시드, CRUD, 가중치 유사도 검색 |
| `backend/app/data/maintenance_history.json` | 더미 정비이력 **64건** + 항공기 메타 (v2.0) |
| `backend/scripts/generate_maintenance_history_seed.py` | 시드 JSON 생성 스크립트 |
| `backend/app/db.py` | `maintenance_history` / `aircraft` 테이블 초기화·시드 |
| `backend/app/api/routes.py` | 정비이력 API 추가, PHM AC-001 허용 |
| `backend/app/data/phm_demo.json` | aircraft_id → AC-001 |
| `backend/tests/test_maintenance_history.py` | 시드·유사검색·등록 테스트 |

### Frontend
| 경로 | 역할 |
|---|---|
| `frontend/src/types/maintenance.ts` | 타입 |
| `frontend/src/data/maintenanceHistory.json` | FE 오프라인 동일 더미 |
| `frontend/src/services/maintenanceHistoryService.ts` | API + 로컬 폴백·유사도·세션 등록 |
| `frontend/src/services/maintenanceHistoryService.test.ts` | Vitest |
| `frontend/src/stores/useAppStore.ts` | `similarHistory`, `historyInsight`, 항공기 선택 |
| `frontend/src/components/FailureCasePanel.tsx` | **[유사 고장] 탭** — `similarHistory` 렌더링 (기존 `failures` API 빈 배열 문제 수정) |
| `frontend/src/components/SimilarMaintenanceCases.tsx` | 진단 패널 유사사례 |

| `frontend/src/components/DiagnosisPanel.tsx` | 교범(공식) + 유사사례 + 종합판단 |
| `frontend/src/components/MaintenanceGuidePanel.tsx` | ①상태 ②교범 ③이력 3단 구성 |
| `frontend/src/components/MaintenanceHistoryPanel.tsx` | 목록·필터·대시보드·상세·등록 |
| `frontend/src/components/Header.tsx` | 항공기 선택 |
| `frontend/src/App.tsx` | 하단 패널 높이 조정 |

---

## 2. 데이터 구조

### Aircraft
`aircraft_id`, `aircraft_type`, `aircraft_number`, `total_flight_hours`, `display_name`

시연 기본: **AC-001 / MUH-1 / 001 / 1,248.5 Hr** (UI 표시: MUH-1 기체번호 001)  
추가 기체: AC-002 ~ AC-004

### MaintenanceHistory
요청 명세 필드 전부 + `symptom_code`, `system_code`(진단 연계용), `is_dummy`

시드 **v2.0 / 64건** (Prototype demonstration data – fictional maintenance records.):

| 시나리오 | symptom_code | 건수 |
|---|---|---|
| 엔진오일 압력 이상 | `ENG_OIL_PRESS_LOW` | 16 |
| 유압 압력 이상 | `HYD_PRESS_LOW` | 14 |
| 발전기 이상 | `GEN_OFF` | 14 |
| Fuel / Rotor / Transmission / Sensor / Electrical / Engine Temp | (기타) | 20 |

기체별: AC-001 **22** · AC-002 **16** · AC-003 **15** · AC-004 **11**

BE SQLite는 JSON `version` 변경 시 dummy 행을 재시드합니다. GitHub Pages는 FE JSON을 번들하여 Backend 없이 동일 데이터를 사용합니다.

---

## 3. API

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/aircraft` | 항공기 목록 |
| GET | `/api/aircraft/{id}` | 항공기 + 이력 건수 |
| GET | `/api/maintenance-history` | 필터 목록 |
| GET | `/api/maintenance-history/stats` | 대시보드 통계 |
| GET | `/api/maintenance-history/similar` | 유사 검색 |
| GET | `/api/maintenance-history/{id}` | 상세 |
| POST | `/api/maintenance-history` | 신규 등록 |
| POST | `/api/maintenance/result` | 기존 단축 등록(이력에도 미러) |

Demo/Pages: Backend 없이도 FE JSON + `sessionStorage`로 동일 흐름 동작.

---

## 4. 유사 검색 방식

가중치 키워드·카테고리 스코어 (0~1), 향후 임베딩으로 교체 가능하도록 `score_similarity` / `scoreSimilarityLocal` 분리.

| 가중치 | 항목 |
|---|---|
| 0.28 | symptom_code 일치 |
| 0.18 | system_code 일치 |
| 0.12 | fault_code 부분일치 |
| 0.32 | 증상·진단·원인·조치 토큰 Jaccard |
| 0.10 | PSI 수치 근접도 |

동일 기체 가점 +0.05.

---

## 5. 화면 변경 요약

- **헤더:** 항공기 선택 (AC-001 / AC-002)
- **진단 패널:** 기술교범(공식) / 과거 유사 정비사례(참고) / AI 종합 판단
- **정비 가이드:** ①현재상태 ②교범 ③이력 + 정비결과등록 버튼
- **정비이력 탭:** 요약·통계·필터 테이블·상세·등록 폼(진단값 자동채움)

구분 문구: **기술교범 = 공식 근거**, **정비이력 = 참고정보**

---

## 6. 시연 절차

1. 헤더에서 **MUH-1 001 (AC-001)** 선택  
2. 질의: `1번 엔진 오일 압력 경고가 발생했는데 어디를 확인해야 해?`  
3. 진단·교범 Source·3D Highlight 확인  
4. 우측 **과거 유사 정비사례** (유사도 % · 원인·조치·결과)  
5. **정비 가이드**에서 ①②③ 및 종합 판단 확인  
6. **정비 결과 등록** → 원인/조치/결과 입력 후 등록  
7. **정비이력** 탭에서 신규 건 조회  
8. 동일 증상 재질의 시 신규 이력이 유사 검색에 포함되는지 확인  

부가: `유압 압력이 이상해` / `발전기 경고가 들어왔어` 도 각각 유사 5건+ 확인.

---

## 7. UI 연결 수정 (유사 고장 탭)

**원인:** 질의 후 유사검색 결과는 `similarHistory`에 저장되었으나, 하단 **[유사 고장]** 탭(`FailureCasePanel`)은 레거시 `failures`만 읽고 있었고, Demo 모드에서는 `failures: []`로 강제 비워 두어 placeholder만 표시됨.

**수정:**
- 질의 완료 시 `searchSimilarLocal`로 즉시 검색 → `similarHistory` + `failures` 동기화
- `FailureCasePanel`이 `similarHistory`를 표시
- 검색 키는 `symptom_code`(예: `ENG_OIL_PRESS_LOW`) 사용 — 3D `FAULT_AREA*` / `PRESSURE_SENSOR`는 사용하지 않음

| 항목 | 값 |
|---|---|
| 기존 건수 | 36 |
| 추가 건수 | +28 |
| 최종 전체 | **64** |
| 엔진오일 (`ENG_OIL_PRESS_LOW`) | 16 |
| 유압 (`HYD_PRESS_LOW`) | 14 |
| 발전기 (`GEN_OFF`) | 14 |
| AC-001 / 002 / 003 / 004 | 22 / 16 / 15 / 11 |
| 저장 위치 | `backend/app/data/maintenance_history.json` · `frontend/src/data/maintenanceHistory.json` (동일) |
| GitHub Pages | Vite 번들된 **FE JSON** (+ sessionStorage 등록분). Backend 불필요 |
| SQLite | `backend/data/app.db` — JSON version 변경 시 dummy 재시드 |

### 유사검색 Top 5 (AC-001 기준)

**엔진오일 31 PSI**  
1. MNT-ENG-001 필터 오염 (64%) · 2. MNT-ENG-002 오일 부족 · 3. MNT-ENG-006 필터 · 4. MNT-ENG-008 보충 미흡 · 5. MNT-ENG-004 라인 누유  

**유압 압력 저하**  
1. MNT-HYD-001 펌프 · 2. MNT-HYD-005 센서 · 3. MNT-HYD-004 필터 · 4. MNT-HYD-003 배관 누유 · 5. MNT-HYD-002 유압유 부족  

**발전기 출력 이상**  
1. MNT-GEN-004 차단기 · 2. MNT-GEN-002 Generator · 3. MNT-GEN-009 Regulator · 4. MNT-GEN-001 Regulator · 5. MNT-GEN-003 배선  

---

## 8. 제한사항

- DELIIS·군 내부망 미연동  
- 유사도는 규칙 기반(프로토타입)  
- 센서값 31 PSI 등은 시연용 표시값  
- 더미 데이터는 JSON/`is_dummy`로 표시 (`Prototype demonstration data – fictional maintenance records.`)
