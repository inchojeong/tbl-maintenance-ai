# 19. UI/UX 개선 변경사항

> Prototype Demo · 공개 기술자료 기반. 기능 로직은 유지하고 표시·문구·정보구조만 정돈.

## 1. 수정 컴포넌트

| 파일 | 변경 |
|---|---|
| `displayLabels.ts` | 계통/구역/뷰타깃 한글 라벨, 답변 톤 정리 |
| `DiagnosisPanel.tsx` | 4단 구조(상태·판단·근거·조치) |
| `AIQueryPanel.tsx` | 정비지원 AI, 시나리오 3버튼 |
| `FailureCasePanel.tsx` | 유사 정비사례 카드·축약 목록 |
| `BottomTabPanel.tsx` | 탭 명칭 |
| `AircraftViewer.tsx` | 3D 상단 상태 문구 |
| `Header.tsx` / `App.tsx` / `DemoControlPanel.tsx` | DEMO 안내 통합 |
| `MaintenanceGuidePanel.tsx` | 가이드 문구 |
| `MaintenanceHistoryPanel.tsx` | 요약·컬럼 정리 |
| `ManualPanel.tsx` | 교범 표시 정리 |

## 2. DiagnosisPanel 정보구조

**변경 전:** 이상계통 → 위험 → 장비 → 권장 → 교범 → 유사 → 종합 → 3D → 신뢰도 (평면 나열)

**변경 후:**
1. 현재 이상 상태 (계통·상태·측정값·정상범위·위험도 badge)
2. AI 판단 (요약 + 우선 점검 + historyInsight)
3. 판단 근거 (기술교범=공식 / 유사사례=참고 + 바로가기)
4. 권장 점검 순서 (번호 목록) + 3D 버튼

## 3. 주요 문구

| 이전 | 이후 |
|---|---|
| AI 질의 / 텍스트·시연용 | 정비지원 AI / 고장 증상이나 계기값을 입력하세요 |
| 대표 시나리오 | 엔진오일·유압·발전기 3버튼 |
| 유사 고장 | 유사 정비사례 |
| 교범 / PHM | 기술교범 / 상태예측(PHM) |
| 상세 위치 보기 | 3D 점검 위치 보기 |
| DEMO / Public TM 반복 | 하단 `Prototype Demo · 공개 기술자료 기반` |

## 4. 개발용 → 사용자용

| 개발용 | 사용자용 |
|---|---|
| `COMPONENT · ENGINE_PRESSURE_SENSOR · AREA_01 · Proxy` | `엔진 오일 압력 센서 · 엔진 정비구역` |
| `FAULT_* · Proxy Detail` | `점검 위치 상세` |
| LIVE | 실시간 |
| Public TM / 더미 뱃지 | 제거 또는 공통 푸터 |

## 5. 유사 정비사례

- 첫 사례: 상세 카드 (유사도·증상·원인·조치·결과)
- 나머지: `89% · 원인 → 조치 → 결과` 축약
- maintenance ID는 보조 텍스트

## 6. 정비이력

- 상단: AC-001 · 누적/30일/반복/비행시간
- 테이블: 일자·계통(한글)·증상·원인·조치·결과
