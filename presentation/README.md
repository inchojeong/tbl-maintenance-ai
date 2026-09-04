# 항공기 통합 정비 지능형 AI 어시스턴트 · 웹 프레젠테이션

제1회 해병대 인공지능 아이디어 시제품 개발 공모전 본선 발표용 반응형 웹 프레젠테이션입니다.
기존 발표자료(v0.4 발표본 · v0.5 슬라이드 마스터 · 3D Drill-down / Sources 참고 장표)의
논리·용어·Visual Identity를 그대로 웹으로 옮겼습니다.

## GitHub Pages

같은 저장소 Pages에 **시제품과 분리된 경로**로 배포됩니다.

- 웹 발표: https://inchojeong.github.io/tbl-maintenance-ai/presentation/
- PDF: https://inchojeong.github.io/tbl-maintenance-ai/presentation/aircraft-maintenance-ai-deck.pdf
- 시제품: https://inchojeong.github.io/tbl-maintenance-ai/

로컬에서 덱만 열려면 `index.html`을 열거나 이 폴더에서 `python -m http.server 8080` 을 실행합니다.

PDF 재생성: `presentation/scripts`에서 `npm install && node export-pdf.mjs`

- **가장 간단한 방법**: `index.html` 더블클릭 → 기본 브라우저에서 열림
- **권장(로컬 서버, 렌더링 100% 보장)**:
  ```bash
  # 이 폴더에서
  python -m http.server 8080
  # 브라우저에서 http://localhost:8080 접속
  ```

발표 전 실제 발표 PC(Windows, 한글 글꼴 포함)에서 한 번 열어 확인하세요.
글꼴은 시스템의 **맑은 고딕(Malgun Gothic)** 을 우선 사용하므로 별도 설치가 필요 없습니다.

## 발표 조작

| 키 | 동작 |
|---|---|
| `→` / `Space` / 마우스 클릭 | 다음 단계(Step) 또는 다음 슬라이드 |
| `←` / 마우스 우클릭 | 이전 단계 또는 이전 슬라이드 |
| `F` | 전체화면 전환 |
| `Esc` | 전체화면 해제 |
| `Home` / `End` | 처음 / 마지막 슬라이드 |
| `B` / `.` | 화면 블랙아웃 토글 |
| 하단 점(dot) | 해당 슬라이드로 바로 이동 |

각 슬라이드는 **평균 1~2클릭으로 내용이 그룹 단위 등장(Step Animation)** 하도록 구성되어 발표 리듬을 유지합니다.
(엔진이 세부 요소를 자동으로 최대 2그룹으로 묶습니다. 슬라이드에 `data-max-steps` 를 지정하면 그룹 수를 조정할 수 있습니다.)
예외로 13번 슬라이드(3D Digital Twin)는 클릭마다 `EXTERIOR → X-RAY → SYSTEM → ENGINE → COMPONENT` 로
카메라가 한 단계씩 진입(Morph)하는 핵심 인터랙션이라 `data-max-steps="4"` 로 단계를 유지합니다.

## 톤 & 장식 (v0.5 마스터 2종)

슬라이드는 **흰색/주황 톤**과 **블랙/파랑 톤**이 순서대로 번갈아 적용됩니다
(1 흰색 → 2 블랙 → 3 흰색 → 4 블랙 … 교대). 톤 전환은 `<section class="slide">` 에
`tone-dark` 클래스를 붙이는 것만으로 제어됩니다(레이아웃 구조는 두 톤 동일).

- **흰색/주황 톤**: 좌상단 = 화면 밖으로 중심이 걸친 **큰 원형 오브젝트의 코너 사분면**(은은한 주황 그라데이션, 저채도라 타이틀·헤더를 가리지 않음).
- **블랙/파랑 톤**: 다크 네이비 배경(대각 sheen)+얇은 밝은 테두리+하단 반사광, 좌상단 = **파란 folded-corner 삼각형**.
- **공통**: 우측 상단의 잘린 원형 라인(앰버 아크) 장식 유지.
- 표지·3D 트윈 슬라이드는 전체 화면 연출을 위해 코너 장식을 생략(`slide--plain`)합니다.

## 화면 규격

- 기본 캔버스 **1920 × 1080 (16:9)** 고정 설계
- 브라우저 크기에 따라 슬라이드 전체가 **비례 축소/확대(Scaling)** — 요소가 제멋대로 재배치되지 않음
- 어떤 해상도의 프로젝터/모니터에서도 PPT와 동일한 레이아웃 유지

## 구조

```
presentation/
├─ index.html      # 18개 슬라이드 마크업
├─ css/deck.css    # v0.5 라이트 테마 디자인 시스템
├─ js/deck.js      # 스케일링 · 스텝 · 키보드 · 카운트업 · 라인드로잉 · 트윈 모프 엔진
└─ README.md
```

## 슬라이드 구성 (18장)

01 표지 · 02 발표 흐름 · 03 문제(숙련 의존) · 04 문제(정보 파편화, 마스터 재현) ·
05 핵심 인사이트(부재가 아닌 연결부재 · Before/After) · 06 제안 개념(질의→AI→트윈 플로우) ·
07 AI Copilot / XAI · 08 시제품 One-Screen · 09 데모(엔진오일 31 PSI) · 10 근거 계층 ·
11 기술 파이프라인 · 12 Safe 3D Link · 13 **3D Digital Twin Drill-down** · 14 기술 스택 ·
15 출처·범위 · 16 Now/Next 로드맵 · 17 Closing · 18 References

## 고지

본 발표자료·시제품은 공개 배포가 허용된 미군 CH-47D 기술교범과 UH-60M 기반 3D 모델, 모의 정비이력을
활용하여 구현 가능성을 검증한 PoC이며, 실제 마린온(MUH-1) 정비교범·기체 내부구조·부대 정비이력은
사용하지 않았습니다.

> 3D Digital Twin 슬라이드는 발표 환경(오프라인·무빌드)에서의 안정성을 위해 실제 GLB WebGL 대신
> 동일한 `EXTERIOR→SYSTEM→ASSEMBLY→COMPONENT` Drill-down 개념을 SVG/CSS Morph로 재현했습니다.
> 실제 Three.js/R3F 기반 시제품은 `../frontend` 앱에서 라이브 시연할 수 있습니다.
