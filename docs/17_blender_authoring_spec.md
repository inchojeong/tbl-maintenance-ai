# 17. Blender / 3D 모델 제작 규격

모델 제작자·외주 전달용. 실제 군용기 내부구조를 재현하지 말 것. 공개/가상 시연 모델만 사용.

---

## 1. 목적

웹(Three.js)에서 **전체 Low-poly 기체 + 정비구역 4곳 High-detail** 을 분리 로드하고, AI Fault Code와 Mesh/CheckPoint를 이름으로 연결한다.

---

## 2. 파일 산출물

| 파일명 | 내용 |
|---|---|
| `Aircraft_Base.glb` | 전체 외형 + `AREA_01~04` 핫스팟 |
| `Maintenance_Area_01.glb` ~ `_04.glb` | 해당 구역 Cover·내부부품·CheckPoint |

---

## 3. Object 분리 기준

반드시 **별도 Object**로 둘 것:

1. 기체 외피 (`AIRCRAFT_BODY`)
2. 구역 핫스팟 (`AREA_0N_HOTSPOT`)
3. 점검 Cover (`AREA_0N_COVER_*`)
4. 내부 점검 부품 (`AREA_0N_PART_*`)
5. 배관/주변 (`AREA_0N_NEAR_*`, optional)
6. Inspection Empty (`AREA_0N_CHECK_*`)

합쳐진 Boolean/Join 메시는 금지(투명화·하이라이트 불가).

---

## 4. Mesh Naming Convention

```text
규칙: UPPER_SNAKE_CASE, ASCII, 공백/한글/특수문자 금지

AIRCRAFT_BODY
AREA_01_HOTSPOT
AREA_01_COVER_01
AREA_01_PART_01
AREA_01_PART_02
AREA_01_NEAR_01
AREA_01_CHECK_01
AREA_01_CHECK_02
```

Area GLB 내부 루트 권장: `AREA_01_ROOT` (Empty/Group)

---

## 5. Material Naming Convention

| 이름 | 용도 |
|---|---|
| `MAT_BODY` | 외피 |
| `MAT_COVER` | 접근 Cover |
| `MAT_PART` | 점검 대상 |
| `MAT_NEAR` | 주변 부품 |
| `MAT_HOTSPOT` | 구역 표시용 |

**중요:** Cover와 Body가 동일 Material 슬롯을 공유하지 말 것. 웹에서 opacity 조절 시 material clone이 필요해진다.

---

## 6. 정비구역 Naming

| area_id | Collection | Hotspot | Detail GLB |
|---|---|---|---|
| AREA_01 | `COL_AREA_01` | `AREA_01_HOTSPOT` | `Maintenance_Area_01.glb` |
| AREA_02 | `COL_AREA_02` | `AREA_02_HOTSPOT` | `Maintenance_Area_02.glb` |
| AREA_03 | `COL_AREA_03` | `AREA_03_HOTSPOT` | `Maintenance_Area_03.glb` |
| AREA_04 | `COL_AREA_04` | `AREA_04_HOTSPOT` | `Maintenance_Area_04.glb` |

---

## 7. Inspection Point 생성

1. `Shift+A` → Empty → Sphere  
2. 이름: `AREA_0N_CHECK_0M`  
3. 점검 부위 표면에 배치 (살짝 바깥으로 offset 2~5cm)  
4. Scale은 시각 확인용, 웹은 위치만 사용  
5. Area GLB에 포함해 Export

---

## 8. Camera Target 생성 (선택)

Empty 두 개:

- `AREA_0N_CAM_POS` — 카메라 위치  
- `AREA_0N_CAM_AIM` — look-at 지점  

Export에서 제외 가능. 좌표는 World Location을 JSON(`viewTargets`)에 수동 기입.

---

## 9. Origin / Pivot

| Object | Origin |
|---|---|
| Root / Base | World (0,0,0) 기체 중심 |
| Cover (Explode용) | 힌지 또는 기하 중심(팀 합의) |
| Part | 기하 중심 |
| CheckPoint | Empty 위치 = 마커 위치 |

Base와 Area의 World Origin이 **반드시 일치**.

---

## 10. 좌표계·단위

- 제작: Blender Z-up  
- Export glTF: **+Y Up** (Blender 기본 체크)  
- 단위: Meter (Scene Properties → Unit System: Metric, Unit Scale 1.0)  
- 전체 기체 길이 스케일이 Base/Area 간 동일해야 함

---

## 11. GLB Export 설정

Blender glTF 2.0:

- Format: **glTF Binary (.glb)**  
- Include: Selected Objects / Limit to Collection  
- Transform: +Y Up  
- Geometry: Apply Modifiers = ON  
- Compression: 가능하면 Draco (또는 별도 glTF-Transform)  
- Animation: Explode는 웹 GSAP 사용 → Blender NLA 불필요(시제품)  
- Camera/Light: 제외  
- Custom Properties: OFF

---

## 12. Texture Resolution

| 용도 | 해상도 |
|---|---|
| Base 외피 | 1024 또는 512 |
| Area 상세 albedo | 1024 |
| Normal/ORM | 1024 이하 |
| 로고/마킹 | 512 |

포맷: PNG 제작 → 배포 시 KTX2 변환 권장. sRGB(Albedo), Linear(ORM/Normal).

---

## 13. Polygon 최적화

| 자산 | 목표 tris |
|---|---:|
| Aircraft_Base | ≤ 80,000 |
| Area 1개 | ≤ 120,000 |
| 동시(Base+1 Area) | ≤ 200,000 |

Decimate / 수동 retopo. 보이지 않는 내면 삭제. Subdivision Surface Apply 후 필요시 단계 낮춤.

---

## 14. 외피·내부 분리 / 투명화 대상

- `AIRCRAFT_BODY`, `AREA_0N_COVER_*` → 투명화 후보  
- `AREA_0N_PART_*` → 하이라이트 후보 (투명화하지 않음)  
- Export 전 제작자에게 `transparent_candidates.txt` 목록 제출

---

## 15. Exploded View 대상

Cover 등:

```text
AREA_01_COVER_01  explode_offset 권장: +Z 또는 +Y 로컬 0.3~0.6m
```

웹 JSON:

```json
{ "mesh": "AREA_01_COVER_01", "offset": [0, 0, 0.45] }
```

방향은 World 기준. 제작 시 기체 축과 맞춰 문서화.

---

## 16. 납품 체크리스트

- [ ] 이름 규칙 준수, 중복 이름 없음  
- [ ] Base Origin = Area Origin  
- [ ] CheckPoint Empty 포함  
- [ ] Cover/Part/Body 재질 분리  
- [ ] tris·용량 기준 충족  
- [ ] 실제 군 부품번호·내부구조 미포함  
- [ ] `faultMeshMap`에 기입할 이름 목록 첨부  

---

## 17. 레거시(현재 Proxy) 호환

1차 시제품 Proxy 이름(`OIL_FILTER` 등)은 AREA_01 구현 전까지 유지한다.  
신규 GLB 제작 시 위 Naming으로 맞추고, FE alias로 구이름을 연결한다.
