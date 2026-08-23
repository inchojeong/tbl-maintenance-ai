# UH-60 Engine Overlay Alignment

Prototype visualization — internal component geometry and exact installation positions are illustrative.

## 1. Measured GLB fit (`sikorsky_uh-60m_blackhawk.glb`)

Normalization: longest axis → `UH60_TARGET_SIZE = 5.8`, then belly lift so center Y ≈ 1.15.

| | Raw | Normalized (world) |
|---|---|---|
| min | [-1.011, -0.332, -1.250] | [-2.347, 0.38, -2.9] |
| max | [1.011, 0.332, 1.250] | [2.347, 1.92, 2.9] |
| size | [2.023, 0.664, 2.500] | [4.693, 1.541, 5.8] |
| center | ~[0, 0, 0] | [0, 1.15, 0] |
| scale | — | **2.32** |
| root position | — | **[0, 1.15, 0]** |

Source constants: `frontend/src/three/maintenance/uh60Fit.ts`

## 2. Axis convention (after fit)

| Axis | Aircraft direction |
|---|---|
| **+X** | Right |
| **−X** | Left |
| **+Y** | Up |
| **−Y** | Down |
| **+Z** | Nose (cockpit cluster toward +Z) |
| **−Z** | Tail |

Longest axis after normalize = **Z** (fuselage length).

## 3. Main rotor / transmission (estimate)

Illustrative hub used for engine bay placement:

```text
mainRotorHub ≈ [0.0, 1.78, 0.15]
upperDeckY   ≈ 1.58
```

Engines sit slightly **forward** (+Z) of the hub and **left/right** of centerline.

## 4. Engine anchors

File: `frontend/src/three/maintenance/maintenanceAnchors.ts`

```text
ENGINE_LEFT_ANCHOR  = [-0.40, 1.62, 0.37]   ← primary (oil scenario)
ENGINE_RIGHT_ANCHOR = [+0.40, 1.62, 0.37]   ← visual twin
```

Hierarchy:

```text
UH60_EXTERIOR (normalized)
MAINTENANCE_INTERNAL_OVERLAY
 └─ ENGINE_OIL_SYSTEM_OVERLAY
      ├─ ENGINE_LEFT_ANCHOR
      │    └─ ENGINE_ASSEMBLY (oil system interactive)
      └─ ENGINE_RIGHT_ANCHOR
           └─ ENGINE_ASSEMBLY (muted twin, no oil interaction)
```

Placeholders (not retuned this pass):

```text
HYDRAULIC_ANCHOR  = [0.05, 1.05, 0.10]
GENERATOR_ANCHOR  = [-0.35, 1.55, 0.60]
```

## 5. Engine assembly scale (scene units)

Approximate T700-class silhouette (not CAD):

| Section | Approx size |
|---|---|
| Overall length (Z) | ~0.52 |
| Diameter | ~0.22 |
| Intake → compressor → core → turbine → exhaust | cylinder / cone / torus primitives |

## 6. Oil system relative coords (local to left engine)

```text
OIL_FILTER        [+0.13, -0.06, +0.02]
OIL_PUMP          [-0.11, -0.08, -0.06]
PRESSURE_SENSOR   [+0.14, +0.04, +0.14]
OIL_PIPE_MAIN     Catmull-Rom through pump → filter → sensor
```

World = `ENGINE_LEFT_ANCHOR + relative`.

## 7. Camera targets (aligned to anchors)

`viewTargets.json` v1.4 — engine views:

| View | Target (approx) |
|---|---|
| ENGINE_OVERVIEW | [0.0, 1.62, 0.37] mid bay |
| ENGINE_OIL_SYSTEM / INTERNAL | left anchor |
| ENGINE_PRESSURE_SENSOR / OIL_SENSOR | left + sensor rel |
| ENGINE_OIL_FILTER | left + filter rel |
| ENGINE_OIL_PUMP | left + pump rel |

Also defined as `ENGINE_CAMERAS` in `maintenanceAnchors.ts`.

## 8. X-Ray opacity

```text
EXTERIOR_XRAY_OPACITY = 0.18
```

(`uh60Fit.ts` → `UH60ExteriorModel`)

## 9. Highlight

Selected maintenance part: amber industrial (`#f59e0b` / emissive `#d97706`), not neon red.

## 10. DEV debug

```bash
# frontend/.env
VITE_DEBUG_3D=true
```

Shows GridHelper, AxesHelper, exterior bbox, anchor markers. Click logs:

```text
World Position / Local Position / Object Name
```

Production / GitHub Pages: leave unset or `false`.

## 11. Tuning checklist

1. Move `ENGINE_LEFT_ANCHOR` / `ENGINE_RIGHT_ANCHOR` only when relocating the bay.
2. Adjust oil parts via `ENGINE_REL.*` only.
3. Re-sync `viewTargets.json` cameraTarget from `ENGINE_CAMERAS` / `worldFromPrimaryRel`.
4. Re-measure GLB if the exterior asset changes; update `uh60Fit.ts`.

## 12. Cutaway retune

Installed-bay look (not floating pods):

| Item | Value |
|---|---|
| ENGINE_LEFT | [-0.30, 1.48, ~0.30] + rot [0.06, 0.14, 0.02] |
| ENGINE_RIGHT | [+0.30, 1.48, ~0.30] + rot [0.06, -0.14, -0.02] |
| ENGINE_ASSEMBLY_SCALE | **1.18** |
| GEARBOX | [0, 1.52, 0.12] (illustrative central drive) |
| SYSTEM camera | [3.6, 1.75, 0.85] → [0, 1.48, 0.22] (¾ side) |
| Exterior opacity | SYSTEM 0.13 / ASSEMBLY 0.07 / COMPONENT 0.045 |

Callouts: screen-space side rails (`CutawayAnnotationOverlay` + `AnnotationProjector`), short elbow leaders, endpoint dots. Legacy world Html callout removed.

Oil REL (No.1 local): filter `[-0.11,-0.085,0.04]`, pump `[0.04,-0.11,-0.04]`, sensor `[-0.12,-0.02,0.13]`.
