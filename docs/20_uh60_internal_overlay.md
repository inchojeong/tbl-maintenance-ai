# UH-60 exterior + internal maintenance overlay

## Architecture

```
AircraftScene
├─ UH60ExteriorModel        (sikorsky_uh-60m_blackhawk.glb — visualization only)
└─ MaintenanceInternalOverlay
   ├─ EngineOilSystemModel
   ├─ HydraulicSystemModel
   └─ GeneratorSystemModel
```

- **UH-60 GLB** = exterior visualization. Mesh names (`Object_0` …) are not remapped to maintenance IDs.
- **Internal Overlay** = prototype maintenance interaction (highlight / x-ray / camera targets).

> Internal maintenance components are prototype visualization objects and do not represent an exact UH-60 internal configuration.

## Exterior X-Ray

View targets set `transparentObjects: ["EXTERIOR"]`.  
`UH60ExteriorModel` applies ~0.22 opacity to **all** exterior meshes when that token is present.

## Maintenance objects (v1)

| ID | System | Approx. position (normalized scene) |
|---|---|---|
| ENGINE_BLOCK | ENGINE_OIL | (0.55, 1.85, 0) |
| OIL_FILTER | ENGINE_OIL | (0.95, 1.72, 0.22) |
| OIL_PUMP | ENGINE_OIL | (0.42, 1.68, -0.18) |
| PRESSURE_SENSOR | ENGINE_OIL | (1.12, 1.95, 0.06) |
| OIL_PIPE_MAIN | ENGINE_OIL | tube through engine bay |
| HYDRAULIC_PUMP | HYDRAULIC | (0.18, 1.12, 0) |
| HYDRAULIC_LINE | HYDRAULIC | tube mid-lower fuselage |
| HYDRAULIC_SENSOR | HYDRAULIC | (0.42, 1.32, 0.22) |
| GENERATOR | ELECTRICAL | (-0.45, 1.62, 0.4) |
| GENERATOR_WIRING | ELECTRICAL | tube to upper bay |

Exterior is auto-normalized to ~5.8 unit longest axis so overlay coordinates stay proxy-compatible.

## Visibility

- Overview: overlay hidden
- Diagnosis / non-overview view target: related system overlay visible + exterior translucent

## Env

```
VITE_USE_PROXY_MODEL=false
VITE_GLTF_MODEL_PATH=models/sikorsky_uh-60m_blackhawk.glb
```

Proxy full airframe is fallback only if GLB load fails.
