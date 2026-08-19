# 13. 테스트 계획

## 공통

- 환경: Chrome 최신, Windows 10+, GPU 가능 PC
- 데이터: 더미 시드
- 실패 시: 이슈 등록 → 담당 수정 → 재실행

---

### T-01 텍스트 질의

| 항목 | 내용 |
|---|---|
| 사전조건 | FE/BE 기동 |
| 입력 | `엔진 오일 압력이 낮고 경고등이 점등되었어.` |
| 절차 | 입력→전송 |
| 기대 | 200, system_code=ENGINE_OIL |
| 실패조치 | 로그 확인, 데모모드 비교 |

### T-02 코드 분류

| 항목 | 내용 |
|---|---|
| 입력 | 대표 질의 5종 |
| 기대 | 허용 enum만 반환, view_target whitelist |
| 실패조치 | 프롬프트/검증 강화 |

### T-03 교범 검색

| 항목 | 내용 |
|---|---|
| API | GET /api/manual/search?q=오일압력&system_code=ENGINE_OIL |
| 기대 | DUMMY-TM-ENG-* 포함, is_dummy=true |
| 실패조치 | Chroma 재적재 |

### T-04 Structured Output 검증

| 항목 | 내용 |
|---|---|
| 절차 | 고의로 잘못된 JSON fixture → validator |
| 기대 | reject 또는 repair 후 유효 |
| 실패조치 | schema 테스트 추가 |

### T-05 3D 오브젝트 클릭

| 항목 | 내용 |
|---|---|
| 사전 | GLB ready, SCR-03 |
| 절차 | ENGINE_ZONE 클릭 |
| 기대 | viewTarget SYSTEM 적용 |
| 실패조치 | raycast layer/이름 확인 |

### T-06 카메라 이동

| 항목 | 내용 |
|---|---|
| 절차 | applyViewTarget(ENGINE_OIL_SYSTEM) |
| 기대 | 1.2s 내 프리셋 도착, target 일치 |
| 실패조치 | viewTargets 좌표 재측정 |

### T-07 외피 투명화

| 항목 | 내용 |
|---|---|
| 절차 | xray ON |
| 기대 | AIRCRAFT_BODY opacity≈0.25, 내부 가시 |
| 실패조치 | material clone 여부 확인 |

### T-08 접근패널 개방

| 항목 | 내용 |
|---|---|
| 절차 | 패널 열기 |
| 기대 | ENGINE_PANEL_LEFT hide/이동 |
| 실패조치 | hideObjects 매핑 확인 |

### T-09 교범 단계↔3D

| 항목 | 내용 |
|---|---|
| 절차 | 가이드 3단계(필터) 클릭 |
| 기대 | ENGINE_OIL_FILTER + 하이라이트 |
| 실패조치 | step map 수정 |

### T-10 모델 로딩 실패

| 항목 | 내용 |
|---|---|
| 절차 | GLB URL 404 |
| 기대 | error UI, 앱 크래시 없음 |
| 실패조치 | ErrorBoundary |

### T-11 외부 API 장애

| 항목 | 내용 |
|---|---|
| 절차 | API 키 제거/차단 |
| 기대 | is_demo=true 고정 응답으로 시연 가능 |
| 실패조치 | demoResponses 키워드 보강 |

### T-12 데모모드

| 항목 | 내용 |
|---|---|
| 절차 | Demo ON → 대표 질의 |
| 기대 | 동일 JSON, 3D 연동 |
| 실패조치 | demoService 매칭 수정 |

### T-13 저사양 성능

| 항목 | 내용 |
|---|---|
| 사전 | pixelRatio cap, shadow off |
| 기대 | 회전 시 대체로 ≥30fps |
| 실패조치 | 메시/텍스처 추가 축소 |

### T-14 E2E 시연 시나리오

| 항목 | 내용 |
|---|---|
| 절차 | docs/11 스크립트 완주 |
| 기대 | SCR-01→11 성공, Reset 후 재현 |
| 실패조치 | 병목 구간 핫픽스 후 리허설 |

## 추적 매트릭스

| 테스트 | 기능 | 화면 |
|---|---|---|
| T-01,02 | F-01,F-02 | SCR-02 |
| T-03 | F-03 | SCR-08 |
| T-05~09 | F-07~10 | SCR-03~07,10 |
| T-11,12 | F-12 | SCR-12 |
| T-14 | P0 전체 | 전체 |
