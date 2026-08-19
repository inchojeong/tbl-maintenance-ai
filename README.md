# AI 항공기 정비 어시스턴트 시제품

해병대 인공지능 아이디어 시제품 공모전용 **AI 기반 항공기 정비 어시스턴트**입니다.

정비 증상을 입력하면 데모(또는 LLM) 응답으로 계통·위험도·점검부품을 구조화하고, `view_target_id`에 따라 3D 디지털트윈이 전체 → 엔진 구역 → 오일 필터로 단계 전환됩니다.

> 본 시제품의 항공기 형상, 교범, 부품명, 센서값, 고장사례 및 점검절차는 기술 검증을 위해 임의 가공한 모의 데이터이며 실제 수리온 정비자료와 무관합니다.

## 기술스택

| 영역 | 기술 |
|---|---|
| Frontend | Vite, React 19, TypeScript, Tailwind CSS 4, Zustand, Axios |
| 3D | Three.js, @react-three/fiber, @react-three/drei, GSAP |
| Backend | FastAPI, Pydantic, SQLite, Uvicorn |
| Deploy | Docker Compose, GitHub Pages (Frontend static) |

## 디렉터리 구조

```text
2차 프로토타입/
├─ docs/                 # 설계 문서 (기존 유지)
├─ frontend/             # Vite React 앱
├─ backend/              # FastAPI
├─ docker-compose.yml
├─ .env.example
└─ README.md
```

## 로컬 실행

### 프론트엔드 (Demo — Backend 불필요)

```bash
cd frontend
npm install
npm run dev
```

앱: http://localhost:5173  

Demo Mode 기본 ON. 대표 질의·Source·Manual·Guide·3D Proxy는 FastAPI 없이 동작합니다.

### 백엔드 (선택 — Demo OFF / LLM / PHM·Failure API)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API 문서: http://localhost:8000/docs

## GitHub Pages (Frontend-only)

Push to `main` → GitHub Actions (`.github/workflows/deploy-pages.yml`)가 `frontend`를 빌드해 Pages에 배포합니다.

- **Backend / OpenAI 불필요** — Demo Mode + Proxy 3D만 사용
- Base path는 Actions의 `configure-pages` → `VITE_BASE_PATH`로 주입 (저장소명 하드코딩 없음)
- 공개 URL: `https://<account>.github.io/<repository>/`

로컬에서 Pages base로 미리 확인:

```bash
cd frontend
# Windows PowerShell
$env:VITE_BASE_PATH="/your-repo-name/"; $env:VITE_USE_PROXY_MODEL="true"; npm run build; npm run preview
```

### Repository Settings (최초 1회)

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. `main`에 push (또는 Actions에서 workflow 수동 실행)
3. Deploy 완료 후 Pages URL 접속

> OpenAI API Key 등 Secret을 Frontend / Pages 환경에 넣지 마세요.
> `.env`, API Key, 비밀번호, 토큰이 들어간 파일은 **절대 commit/push하지 마세요.** (`.gitignore`에 제외됨. 템플릿은 `.env.example`만 사용)

## Docker 실행

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend: http://localhost:8000

## 환경변수

| 변수 | 설명 | 기본 |
|---|---|---|
| `VITE_API_BASE_URL` | FastAPI Base URL (로컬·Demo OFF) | `http://localhost:8000` |
| `VITE_USE_PROXY_MODEL` | `true`면 프록시 메시 | `true` |
| `VITE_GLTF_MODEL_PATH` | GLB 경로 (`public/` 기준) | `models/aircraft_maintenance_demo.glb` |
| `VITE_BASE_PATH` | Vite `base` (Pages CI만) | 미설정 시 `/` |
| `OPENAI_API_KEY` | Backend LLM용 (FE/Pages에 넣지 말 것) | (비움) |

## 데모 질의 예시

```text
엔진 오일 압력이 낮고 경고등이 점등되었어.
엔진 오일 압력이 낮아
오일 경고등이 켜졌어
엔진에서 오일이 새는 것 같아
```

기대 결과: `ENGINE_OIL` / `LOW_OIL_PRESSURE` / `HIGH` / `view_target_id=ENGINE_OIL_SYSTEM`

## 3D 화면 조작법

1. 질의 전송 → 엔진 구역 하이라이트
2. 엔진 구역 클릭 또는 **엔진 구역** 버튼 → 접근패널 시점
3. **패널 열기** → 내부 투시 + 부품 표시
4. **오일 필터** 또는 가이드 4단계 → 필터 확대·하이라이트
5. 마우스 드래그 회전 / 휠 줌
6. 헤더 **초기화**로 장면·채팅 리셋

## 실제 GLB 교체 방법

1. Blender에서 오브젝트 이름을 `AIRCRAFT_BODY`, `ENGINE_ZONE`, `OIL_FILTER` 등으로 맞춤
2. `frontend/public/models/aircraft_maintenance_demo.glb`에 배치
3. `frontend/.env`에서 `VITE_USE_PROXY_MODEL=false`
4. 누락 오브젝트는 화면 경고 + 콘솔에 표시되며, 로딩 실패 시 프록시로 fallback

## 테스트

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

## 제한사항

- 실제 군 교범·센서·정비체계 미연동
- 프록시 3D는 시연용 단순 형상
- 음성/이미지 API는 501(미구현) 또는 후속 단계
- ChromaDB는 인터페이스(키워드 검색)만 준비

## 가정

- 대표 시나리오는 엔진 오일 압력 저하 1종으로 시연 가능
- GLB가 없어도 프록시로 클릭·카메라·투명화·패널·하이라이트 검증 가능
