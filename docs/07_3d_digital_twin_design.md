# 07. 3D 디지털트윈 상세 설계

## 1. 목표

정밀도보다 **단계적 접근(전체→구역→패널→부품)** 과 클릭·확대·투명화·하이라이트를 안정적으로 시연한다.

## 2. GLB 로딩 구조

```text
AircraftViewer
 └─ Canvas
     └─ AircraftScene
         ├─ Suspense + useGLTF('/models/aircraft_maintenance_demo.glb')
         ├─ AircraftModel (scene graph walk by name)
         ├─ CameraController
         ├─ HighlightController
         ├─ XRayController
         ├─ MaintenancePath (P1)
         ├─ OrbitControls (enableDamping)
         └─ Environment / Lights
```

- `useGLTF.preload`로 초기 화면에서 선행 로드.
- 실패 시 `modelStatus='error'`, 사용자에게 재시도/데모 안내.

## 3. Blender 오브젝트 분리 규칙

1. 외형, 접근패널, 내부 부품은 **별도 Object**.
2. Modifier Apply 후 Export(glTF Embedded/GLB).
3. Origin은 월드 일관성 유지(기체 중심 기준).
4. 불필요 카메라는 Export에서 제외.
5. 이름에 공백·한글 금지(영문 SNAKE_CASE).

## 4. 오브젝트 명명 규칙 (최소 구현)

| Object Name | 역할 |
|---|---|
| AIRCRAFT_BODY | 외피 |
| ENGINE_ZONE | 엔진 구역 콜라이더/표시 |
| ENGINE_PANEL_LEFT | 좌측 접근패널 |
| ENGINE_PANEL_RIGHT | 우측 접근패널 |
| ENGINE_BLOCK | 엔진 블록 |
| OIL_FILTER | 오일 필터 |
| OIL_PUMP | 오일 펌프 |
| PRESSURE_SENSOR | 압력센서 |
| OIL_PIPE_MAIN | 메인 오일 배관 |
| LANDING_GEAR_LEFT | 좌 랜딩기어 |
| LANDING_GEAR_RIGHT | 우 랜딩기어 |
| MAIN_ROTOR | 메인 로터 |
| TAIL_ROTOR | 테일 로터 |

## 5. 클릭 / Raycasting

- R3F `onClick` on mesh (또는 부모 group).
- `ENGINE_ZONE` / `ENGINE_PANEL_*` / `OIL_*`만 interactive.
- 클릭 시 `componentMap[objectName].viewTargetId` → `applyViewTarget`.
- 드래그와 클릭 구분: pointer distance threshold < 4px.

## 6. 카메라 프리셋 단계

| Level | viewTargetId | 설명 |
|---|---|---|
| AIRCRAFT | `AIRCRAFT_OVERVIEW` | 전체 |
| SYSTEM | `ENGINE_OIL_SYSTEM` | 엔진 구역 |
| COMPONENT | `ENGINE_OIL_FILTER` | 필터 근접 |
| COMPONENT | `ENGINE_OIL_PUMP` | 펌프(선택) |
| COMPONENT | `ENGINE_PRESSURE_SENSOR` | 센서(선택) |

애니메이션: GSAP `duration 1.0~1.4`, `ease power2.inOut`, camera.position + controls.target 동시 tween.

## 7. 외피 투명화

- `transparentObjects`의 material에 `transparent=true`, `opacity` tween (1→0.25).
- `depthWrite=false` 주의(정렬 이슈) → 시연에서는 body만 반투명.

## 8. 접근패널

- P0: `visible=false` 또는 `hideObjects`.
- P1: position.x ± offset GSAP (분리 애니).

## 9. 부품 하이라이트

- emissive `#ff3b30` / intensity pulse (P1).
- 비대상은 채도 낮춤(optional).

## 10. 라벨·접근경로

- Drei `Html`로 “엔진 · 오일계통” 라벨.
- `MaintenancePath`: Line + cone arrow (P1).

## 11. 장면 초기화

`resetScene()`:

- viewTarget=`AIRCRAFT_OVERVIEW`
- openedPanels=[]
- xray=false
- highlight/hide/transparent 원복(material cache 필요)

## 12. 성능·용량

| 항목 | 권장 |
|---|---|
| GLB 용량 | ≤ 15MB (목표 8MB) |
| 텍스처 | 1024 이하, 중요부 2048 최대 |
| 폴리곤 | 전체 ≤ 300k tris (시연 목표 150k) |
| 최적화 | glTF Transform: draco, resize, prune, instancing 검토 |
| 저사양 | pixelRatio max 1.5, shadow off, Environment intensity↓ |

## 13. viewTargets.json 스키마

```json
{
  "$schema": "ViewTargets",
  "version": "1.0",
  "targets": {
    "<VIEW_TARGET_ID>": {
      "level": "AIRCRAFT|SYSTEM|COMPONENT",
      "label": "string",
      "cameraPosition": [0, 0, 0],
      "cameraTarget": [0, 0, 0],
      "highlightObjects": ["OBJECT_NAME"],
      "hideObjects": ["OBJECT_NAME"],
      "transparentObjects": ["OBJECT_NAME"],
      "openPanels": ["ENGINE_PANEL_LEFT"],
      "duration": 1.2
    }
  }
}
```

샘플: `frontend/src/data/viewTargets.example.json`

## 14. componentMap.json 스키마

```json
{
  "AIRCRAFT_BODY": {
    "componentCode": null,
    "systemCode": null,
    "clickable": false,
    "viewTargetId": null
  },
  "OIL_FILTER": {
    "componentCode": "OIL_FILTER",
    "systemCode": "ENGINE_OIL",
    "clickable": true,
    "viewTargetId": "ENGINE_OIL_FILTER"
  }
}
```

샘플: `frontend/src/data/componentMap.example.json`
