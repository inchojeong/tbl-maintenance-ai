# 06. 프론트엔드 상세 설계

## 1. 권장 프로젝트 구조

```text
frontend/
├─ package.json
├─ vite.config.ts
├─ tailwind.config.js
├─ index.html
├─ public/
│  └─ models/aircraft_maintenance_demo.glb
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ styles/index.css
   ├─ types/diagnosis.ts
   ├─ data/
   │  ├─ viewTargets.json
   │  ├─ componentMap.json
   │  └─ demoResponses.json
   ├─ stores/
   │  ├─ useDiagnosisStore.ts
   │  ├─ useThreeStore.ts
   │  └─ useUiStore.ts
   ├─ services/
   │  ├─ api.ts
   │  ├─ queryService.ts
   │  └─ demoService.ts
   ├─ components/
   │  ├─ layout/AppHeader.tsx
   │  ├─ AIQueryPanel.tsx
   │  ├─ DiagnosisPanel.tsx
   │  ├─ DemoControlPanel.tsx
   │  ├─ AircraftViewer.tsx
   │  ├─ panels/
   │  │  ├─ ManualPanel.tsx
   │  │  ├─ FailureCasePanel.tsx
   │  │  ├─ PHMPanel.tsx
   │  │  ├─ MaintenanceGuidePanel.tsx
   │  │  └─ MaintenanceHistoryPanel.tsx
   │  └─ three/
   │     ├─ AircraftScene.tsx
   │     ├─ AircraftModel.tsx
   │     ├─ CameraController.tsx
   │     ├─ HighlightController.tsx
   │     ├─ XRayController.tsx
   │     └─ MaintenancePath.tsx
   └─ hooks/useViewTarget.ts
```

## 2. 라우팅

시제품은 **단일 라우트(`/`)** + 하단 탭으로 충분하다.

| 경로 | 용도 |
|---|---|
| `/` | One-Screen 메인 |
| `/health`(선택) | FE 헬스 |

(기존 프로토타입의 `/manuals` 등은 탭으로 흡수.)

## 3. Zustand Store

### useDiagnosisStore

```typescript
interface DiagnosisState {
  aircraftId: string;
  messages: ChatMessage[];
  result: DiagnosisResult | null;
  manuals: ManualChunk[];
  failures: FailureCase[];
  phm: PhmStatus | null;
  guideSteps: GuideStep[];
  guideStepIndex: number;
  loading: boolean;
  error: string | null;
  isDemo: boolean;
  submitQuery: (text: string) => Promise<void>;
  setGuideStep: (i: number) => void;
  reset: () => void;
}
```

### useThreeStore

```typescript
interface ThreeState {
  viewLevel: "AIRCRAFT" | "SYSTEM" | "COMPONENT";
  viewTargetId: string;
  xrayMode: boolean;
  openedPanels: string[];
  highlightedObjects: string[];
  hiddenObjects: string[];
  transparentObjects: string[];
  modelStatus: "idle" | "loading" | "ready" | "error";
  applyViewTarget: (id: string) => void;
  toggleXray: (on: boolean) => void;
  openPanel: (name: string) => void;
  resetScene: () => void;
}
```

### useUiStore

```typescript
interface UiState {
  activeTab: "manual" | "failure" | "phm" | "guide" | "history";
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  setTab: (t: UiState["activeTab"]) => void;
}
```

## 4. Props·상태 흐름

```text
AIQueryPanel.submit
  → diagnosisStore.submitQuery
    → api.post('/api/query') | demoService
    → set result
    → threeStore.applyViewTarget(result.view_target_id)
AircraftViewer/Controllers ← threeStore
DiagnosisPanel ← diagnosisStore.result
ManualPanel ← diagnosisStore.manuals
GuidePanel.setStep → threeStore.applyViewTarget(step.viewTargetId)
```

## 5. API 서비스

```typescript
// services/api.ts
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE ?? "http://localhost:8000" });

// queryService.ts
export async function postQuery(body: QueryRequest): Promise<DiagnosisResult> { ... }
```

데모모드 또는 API 실패 시 `demoService.match(query)`로 `demoResponses.json` 반환.

## 6. 공통 타입 (요약)

```typescript
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type SystemCode = "ENGINE_OIL" | "ENGINE_COOLING" | "LANDING_GEAR" | "MAIN_ROTOR" | "UNKNOWN";
export type ComponentCode = "OIL_FILTER" | "OIL_PUMP" | "PRESSURE_SENSOR" | "ACCESS_PANEL" | "UNKNOWN";

export interface DiagnosisResult {
  system_code: SystemCode;
  symptom_code: string;
  risk_level: RiskLevel;
  suspected_components: ComponentCode[];
  answer: string;
  manual_ids: string[];
  recommended_steps: string[];
  view_target_id: string;
  confidence: number;
  is_demo: boolean;
}
```

## 7. 에러·로딩·데모·초기화

| 주제 | 정책 |
|---|---|
| 로딩 | `loading=true` 시 입력 비활성 + 스피너 |
| API 에러 | 1회 재시도 후 demo fallback, `is_demo=true` |
| 데모모드 | UI 토글 또는 자동 fallback |
| 초기화 | Reset → stores.reset + `/api/demo/reset` |
| 모델 에러 | modelStatus=error, 안내 문구 |

## 8. 반응형

| 구간 | 정책 |
|---|---|
| ≥1280px | 3열 레이아웃(시연 기준) |
| 1024~1279 | 3열 축소, 폰트/패딩 축소 |
| <1024 | 시연 비권장. 세로 스택(질의→3D→진단) |

시연 PC Full HD를 기준으로 한다.

## 9. 컴포넌트 명세표

| 컴포넌트 | 역할 | Props | 내부상태 | API | 연동 |
|---|---|---|---|---|---|
| AIQueryPanel | 질의 입력·채팅 | - | input draft | POST /api/query | diagnosisStore |
| AircraftViewer | Canvas 래퍼 | className? | - | GET /api/3d/map | threeStore |
| AircraftScene | R3F Scene | - | - | - | controllers |
| AircraftModel | GLB 로드 | url | - | - | componentMap |
| CameraController | 카메라 애니 | - | tween | - | viewTargets |
| HighlightController | 하이라이트 | - | - | - | highlightedObjects |
| XRayController | 투명화 | - | - | - | transparentObjects |
| MaintenancePath | 접근경로 라인 | visible? | - | - | P1 |
| DiagnosisPanel | 우측 요약 | - | - | - | diagnosis.result |
| ManualPanel | 교범 | - | query | GET /manual/search | diagnosis |
| FailureCasePanel | 유사고장 | - | - | GET /failures/search | diagnosis |
| PHMPanel | PHM | - | - | GET /phm/{id} | diagnosis |
| MaintenanceGuidePanel | 가이드 | - | step | - | three+diagnosis |
| MaintenanceHistoryPanel | 이력 | - | form | POST /maintenance/result | diagnosis |
| DemoControlPanel | 데모/리셋 | - | - | POST /demo/reset | ui+stores |
