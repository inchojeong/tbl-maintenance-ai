# 15. 기존 소스 분석

> 분석 기준일: 2026-08-05  
> 로컬 워크스페이스와 원격 참고 프로토타입(`https://marine-ref.github.io/prototype/`, GitHub `marine-ref/prototype`)을 대조 분석한다.

---

## 1. 로컬 프로젝트 파일 트리

현재 로컬 워크스페이스에는 **실행 가능한 프론트엔드/백엔드 소스가 없다.** 존재하는 파일은 다음과 같다.

```text
2026 해병대 인공지능 아이디어 시제품 개발 공모전/
└─ !시제품 준비 - 9. [군수] 항공기 통합 정비 지능형 AI 어시스턴트 (전군 수리온 계열 통합 정비시스템)/
   ├─ AI_항공기_정비_어시스턴트_기술스택_개발범위.md   ← 기술 정의서(요구사항)
   └─ 프로토타입.url                                    ← https://marine-ref.github.io/prototype/
```

| 경로 | 유형 | 역할 |
|---|---|---|
| `.../AI_항공기_정비_어시스턴트_기술스택_개발범위.md` | Markdown | 시제품 개발 범위·기술스택·시나리오 정의 |
| `.../프로토타입.url` | Internet Shortcut | 참고 UI 프로토타입 링크 |

**결론:** 로컬에는 재사용할 UI/3D/API 코드가 없으며, **원격 GitHub 프로토타입**과 **로컬 기술정의서**가 설계의 출발점이다.

---

## 2. 원격 프로토타입 파일 트리 (근거: GitHub `marine-ref/prototype` recursive tree)

```text
marine-ref/prototype/
├─ .github/workflows/deploy-pages.yml
├─ README.md
├─ docs/
│  ├─ README.md
│  ├─ UI-현황-전달서.md
│  ├─ 프로토타입-정의서.md
│  ├─ 시스템-아키텍처.md
│  ├─ User-Journey-IA.md
│  ├─ AI-파이프라인.md
│  ├─ API-명세.md
│  ├─ DB-ERD.md
│  └─ images/ (dashboard.png, assistant.png, phm.png)
└─ web/                          ← Next.js 15 앱
   ├─ package.json
   ├─ next.config.ts
   ├─ public/twin/surion-side.png   ← 2D 측면 이미지 (약 1.9MB)
   └─ src/
      ├─ app/
      │  ├─ layout.tsx
      │  ├─ page.tsx                 ← 현황 (/)
      │  ├─ globals.css
      │  ├─ assistant/page.tsx       ← One-Screen AI
      │  ├─ manuals/page.tsx
      │  ├─ failures/page.tsx
      │  ├─ phm/page.tsx
      │  ├─ guide/page.tsx
      │  └─ history/page.tsx
      ├─ components/
      │  ├─ AppShell.tsx
      │  ├─ Sidebar.tsx
      │  ├─ DemoFlowNav.tsx
      │  ├─ AssistantChat.tsx       ← 좌측 AI 질의
      │  ├─ DigitalTwinViewer.tsx   ← 중앙 2D 트윈
      │  └─ AlertSummaryCard.tsx    ← 우측 분석정보
      ├─ data/mock.ts               ← 전체 Mock 데이터
      └─ lib/asset.ts               ← basePath 자산 경로
```

---

## 3. 사용 중인 프론트엔드 프레임워크

| 항목 | 실제 값 | 근거 |
|---|---|---|
| 프레임워크 | **Next.js 15.5.22** (App Router) | `web/package.json` |
| UI 라이브러리 | **React 19.1.0** | `web/package.json` |
| 언어 | **TypeScript 5** | `web/tsconfig.json`, `.tsx` |
| 스타일 | **Tailwind CSS 4** (`@tailwindcss/postcss`) | `web/package.json`, `postcss.config.mjs` |
| 차트 | Recharts 3 | `web/src/app/phm/page.tsx` |
| 아이콘 | lucide-react | `AssistantChat.tsx` |
| 상태관리 | **없음** (로컬 `useState` + 정적 import) | 전역 store 파일 부재 |
| 3D | **없음** (PNG + CSS overlay) | `DigitalTwinViewer.tsx` |
| AI/백엔드 | **없음** (하드코딩 응답) | `AssistantChat.tsx` `send()` |
| 배포 | GitHub Pages static export (`basePath=/prototype`) | README, `asset.ts` |

**본 시제품 확정 스택과의 차이:** 권장안은 **Vite + React + TypeScript**이다. Next.js App Router·SSR·Pages basePath는 시제품 3D/FastAPI Docker Compose와 불필요하게 결합되므로, **UI/레이아웃 패턴만 이관하고 빌드 체계는 Vite로 신규 구성**한다.

---

## 4. HTML / CSS / JavaScript / 정적 리소스 구조

| 구분 | 위치 | 설명 |
|---|---|---|
| 라우트 페이지 | `web/src/app/**/page.tsx` | 화면별 페이지 컴포넌트 |
| 전역 스타일 | `web/src/app/globals.css` | Tailwind 진입·토큰 |
| 레이아웃 | `web/src/app/layout.tsx` + `AppShell.tsx` | 사이드바 + 헤더 셸 |
| 정적 이미지 | `web/public/twin/surion-side.png` | 디지털트윈 측면도 |
| Mock 데이터 | `web/src/data/mock.ts` | 기체·채팅·교범·고장·PHM·가이드 |
| 자산 헬퍼 | `web/src/lib/asset.ts` | Pages `basePath` 보정 |

별도의 순수 HTML/vanilla JS 번들은 없다. 전부 Next.js 클라이언트 컴포넌트(`"use client"`) 구조이다.

---

## 5. 화면별 파일 위치

| 화면 | 경로 | 라우트 |
|---|---|---|
| 현황(대시보드) | `web/src/app/page.tsx` | `/` |
| AI 어시스턴트 One-Screen | `web/src/app/assistant/page.tsx` | `/assistant` |
| 교범 검색 | `web/src/app/manuals/page.tsx` | `/manuals` |
| 유사 고장 | `web/src/app/failures/page.tsx` | `/failures` |
| PHM 상태 | `web/src/app/phm/page.tsx` | `/phm` |
| 정비 가이드 | `web/src/app/guide/page.tsx` | `/guide` |
| 질의·조치 이력 | `web/src/app/history/page.tsx` | `/history` |

시연 네비게이션: `DemoFlowNav.tsx`, `Sidebar.tsx`.

---

## 6. 중앙 항공기 이미지 구현

**파일:** `web/src/components/DigitalTwinViewer.tsx`  
**이미지:** `web/public/twin/surion-side.png` (asset helper로 로드)

구현 방식 요약:

1. `highlightPartId` prop 기본값 `"engine-oil"`.
2. `engineHot = highlightPartId === "engine-oil"`일 때 CSS로 빨간 점선 원·라벨 오버레이.
3. 하단 바로가기 링크: 교범 / 유사고장 / PHM / 가이드 / 이력.
4. Three.js·클릭 확대·패널 개방·투명화 **미구현**.

**3D Canvas 삽입 위치:** `assistant/page.tsx`의 중앙 컬럼에서 `DigitalTwinViewer`를 `AircraftViewer`(R3F Canvas)로 **교체**한다. 헤더·좌·우 패널 비율은 유지.

---

## 7. 좌측 AI 질의 영역

**파일:** `web/src/components/AssistantChat.tsx`

| 항목 | 구현 |
|---|---|
| 초기 메시지 | `initialChat` from `mock.ts` |
| 입력 | 텍스트 + 음성/사진 버튼(시연용, 실제 녹음/비전 없음) |
| 응답 | `send()` 내 **고정 문자열** 1종 |
| 상태 | 컴포넌트 로컬 `useState` |
| 연동 | `onQuery?.(q)` 콜백만 제공, 부모에서 미사용 |

재사용 가능: 채팅 UI 레이아웃, 입력 폼, 역할 라벨.  
전면 수정: API 호출, Structured Output 반영, 로딩/에러/데모모드.

---

## 8. 우측 분석정보 영역

**파일:** `web/src/components/AlertSummaryCard.tsx`  
**데이터:** `alertSummary` in `mock.ts`

표시 항목: 이상 항목, 위협 수준, 권고 조치, 신뢰도, 가이드/교범/사례/PHM 링크.  
질의 결과와 **동적 연동되지 않음**(정적 import).

재사용 가능: 카드 레이아웃·필드 구조.  
전면 수정: `DiagnosisResult` 바인딩, `viewTargetId` 연동, risk/system/component 코드 표시.

---

## 9. 교범 / 유사고장 / PHM / 정비가이드

| 기능 | 파일 | 데이터 | 구현 방식 |
|---|---|---|---|
| 교범 | `app/manuals/page.tsx` | `manualHits` | 카드 리스트, 검색 API 없음 |
| 유사고장 | `app/failures/page.tsx` | `failureCases` | 유사도·원인·조치 카드 |
| PHM | `app/phm/page.tsx` | `phmParts` | 센서·RUL·Recharts |
| 가이드 | `app/guide/page.tsx` | `guideSteps` | 단계 리스트, 3D 연동 없음 |
| 이력 | `app/history/page.tsx` | (페이지 내 테이블) | 정적 타임라인 |

현재는 **별도 라우트 페이지**이다. 본 시제품은 One-Screen 하단 탭(`ManualPanel` 등)으로 통합하되, Mock 필드명·시나리오 문구는 이관한다.

---

## 10. 재사용 가능한 코드

| 자산 | 재사용 수준 | 이관 방법 |
|---|---|---|
| One-Screen 3단 레이아웃 개념 | 높음 | Vite React 레이아웃으로 재구현 |
| `mock.ts` 시나리오 데이터 | 높음 | JSON/SQLite 시드 및 데모 응답으로 변환 |
| Tailwind 톤(라이트·카드·브랜드) | 중간 | CSS 변수로 재정의 후 유사 유지 |
| `AssistantChat` UX | 중간 | 컴포넌트 재작성 + API 연동 |
| `AlertSummaryCard` 필드 | 중간 | `DiagnosisPanel`로 확장 |
| `Sidebar` / `DemoFlowNav` | 낮음~중간 | 시연 단계 네비 참고 |
| `DigitalTwinViewer` | **폐기(교체)** | 3D Canvas로 대체, PNG는 폴백 썸네일로만 선택 사용 |
| Next.js 라우팅·Pages 배포 | 폐기 | Vite SPA + Docker |

---

## 11. React(Vite) 전환 시 수정 범위

| 영역 | 조치 |
|---|---|
| 빌드 | Next → **Vite** 신규 스캐폴딩 |
| 라우팅 | App Router → React Router(또는 단일 One-Screen + 탭) |
| 디지털트윈 | PNG overlay → **R3F + GLB** |
| AI | 하드코딩 → FastAPI `/api/query` + 데모 fallback |
| 상태 | 로컬 state → **Zustand** (`diagnosis` + `three`) |
| 데이터 | `mock.ts` → API + 로컬 JSON 캐시 |
| 배포 | gh-pages → Docker Compose (frontend+backend) |

---

## 12. 기존 디자인을 유지하며 3D Canvas를 삽입할 위치

```text
/assistant One-Screen (유지)
┌──────────────┬────────────────────────┬──────────────┐
│ AIQueryPanel │ AircraftViewer ★교체    │ DiagnosisPanel│
│ (구 Assistant│  ← DigitalTwinViewer    │ (구 AlertSum) │
│  Chat)       │    자리                 │              │
└──────────────┴────────────────────────┴──────────────┘
│ BottomTabPanel: Manual | Failure | PHM | Guide | History │
└──────────────────────────────────────────────────────────┘
```

권장 비율(기술정의서): 좌 22% / 중 53% / 우 25%.

---

## 13. 기술 부채 및 개발 위험

| ID | 부채/위험 | 영향 | 완화 |
|---|---|---|---|
| D1 | AI 응답이 고정 문자열 | 실 LLM/RAG 미검증 | 주 시나리오 데모모드 + API 이중화 |
| D2 | 디지털트윈이 2D PNG | 패널/투명화/부품 하이라이트 불가 | 최소 GLB 오브젝트 세트 제작 |
| D3 | 전역 상태 없음 | 탭·3D·채팅 동기화 불가 | Zustand 설계 선행 |
| D4 | Next→Vite 전환 공수 | 컴포넌트 전면 재작성 | 레이아웃/데이터만 이식 |
| D5 | 교범이 실제처럼 보일 수 있음 | 보안·규정 리스크 | `is_dummy` 배지 필수 |
| D6 | GLB/블렌더 일정 | 3D가 시연 병목 | 박스 프록시 메시로 1차 시연 |
| D7 | 외부 LLM 장애 | 공모전 시연 실패 | `demoResponses` 키워드 매칭 |
| D8 | surion-side.png 1.9MB | 로딩 지연 | 3D 전환 후 제거 또는 압축 |

---

## 14. 로컬 기술정의서와의 정합성

`AI_항공기_정비_어시스턴트_기술스택_개발범위.md`는 본 문서 세트의 요구사항 원천이다.  
원격 프로토타입은 **UI 시연용 Mock**이며, 기술정의서가 정의한 **3D·RAG·FastAPI·데모모드**는 아직 미구현이다.

---

## 15. 분석 판정 요약

| 판정 | 내용 |
|---|---|
| 로컬 실행 소스 | **없음** |
| 참고 UI | GitHub Pages 프로토타입 (Next.js) |
| 재사용 | 레이아웃 개념 + Mock 시나리오 데이터 |
| 전면 신규 | Vite FE, FastAPI BE, R3F 3D, RAG, 데모모드 |
| 중앙 영역 | `DigitalTwinViewer` → `AircraftViewer` 교체가 핵심 |
