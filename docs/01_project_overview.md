# 01. 프로젝트 개요

## 1. 문서 목적

해병대 인공지능 아이디어 시제품 공모전용 **AI 기반 항공기 정비 어시스턴트**의 목표, 범위, 기술 확정안, 시연 원칙을 정의한다. 개발자는 본 문서와 `02`~`15` 문서만으로 구현을 시작할 수 있어야 한다.

## 2. 한 줄 정의

정비사가 증상(텍스트/음성/사진)을 입력하면 LLM이 계통·증상·위험도를 구조화하고, 더미 교범 RAG·유사고장·PHM을 결합한 뒤, 사전 정의된 `viewTargetId`로 3D 항공기 점검 위치를 단계적으로 안내하는 **시연용 시제품**이다.

## 3. 대상 기체·시나리오

| 항목 | 값 |
|---|---|
| 시연 기체 ID | `DEMO-KUH-01` (표시명 Surion-KUH-01) |
| 대표 질의 | `엔진 오일 압력이 낮고 경고등이 점등되었어.` |
| system_code | `ENGINE_OIL` |
| symptom_code | `LOW_OIL_PRESSURE` |
| risk_level | `HIGH` |
| 우선 부품 | `OIL_FILTER` |
| 1차 view_target_id | `ENGINE_OIL_SYSTEM` |
| 2차 view_target_id | `ENGINE_OIL_FILTER` |

## 4. 확정 기술스택

| 계층 | 확정 기술 |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Axios, Zustand |
| 3D | Three.js, @react-three/fiber, @react-three/drei, GSAP, Blender → GLB |
| Backend | Python 3.11+, FastAPI, Pydantic v2, SQLite |
| AI/RAG | OpenAI GPT API(주) / 데모모드 fallback, OpenAI Embedding 또는 로컬 SentenceTransformer, ChromaDB, PyMuPDF(선택), Whisper API(권장) |
| Deploy | Docker Compose |

**결정 필요(미확정):** LLM 벤더를 OpenAI만 쓸지 Gemini를 보조로 둘지 → 기본은 OpenAI, 키 없으면 데모모드.

## 5. 핵심 구현 원칙

1. LLM은 3D 좌표를 생성하지 않는다. `view_target_id`만 반환한다.
2. 프론트는 `viewTargets.json`으로 카메라·하이라이트·투명화·패널을 제어한다.
3. Blender 메시는 외형 / 접근패널 / 내부부품을 분리한다.
4. 모든 교범·부품·센서·사례는 **더미**이며 UI에 고지한다.
5. 대표 질의는 캐시하여 외부 API 장애 시에도 동일 시연이 가능해야 한다.

## 6. 기존 자산과의 관계

| 자산 | 역할 |
|---|---|
| 로컬 `AI_항공기_정비_어시스턴트_기술스택_개발범위.md` | 요구사항 원천 |
| `https://marine-ref.github.io/prototype/` | One-Screen UI 참고 |
| GitHub `marine-ref/prototype` | Next.js Mock UI 소스(레이아웃·시나리오 이관) |

상세 분석: [`15_existing_source_analysis.md`](./15_existing_source_analysis.md)

## 7. 산출물 맵

| 문서 | 내용 |
|---|---|
| 02 | 개발 범위(필수/권장/제외) |
| 03 | 기능명세서(기능 ID) |
| 04 | 화면정의서(화면 ID) |
| 05 | 시스템 아키텍처 |
| 06 | 프론트엔드 설계 |
| 07 | 3D 디지털트윈 설계 |
| 08 | AI·RAG 설계 |
| 09 | 데이터 모델 |
| 10 | API 명세 |
| 11 | 데모 시나리오 |
| 12 | 개발 일정 |
| 13 | 테스트 계획 |
| 14 | 보안·제한사항 |
| 15 | 기존 소스 분석 |

## 8. 완료 기준(시제품)

- 텍스트 질의 → 구조화 진단 → 교범 근거 표시
- 전체 기체에서 엔진 구역 하이라이트 → 클릭 시 카메라 이동
- 패널 개방/투명화 → `OIL_FILTER` 하이라이트
- 가이드 단계와 3D 연동
- 데모모드로 오프라인 시연 가능
- 모든 화면에 더미 데이터 고지

## 9. 필수 고지 문구

> 본 시제품의 항공기 형상, 교범, 부품명, 센서값, 고장사례 및 점검절차는 기술 검증을 위해 임의 가공한 모의 데이터이며 실제 수리온 정비자료와 무관합니다.
