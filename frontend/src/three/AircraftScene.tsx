import { Suspense, useRef, useState, Component, type ReactNode } from "react";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useAppStore } from "../stores/useAppStore";
import { ProxyAircraftModel } from "./ProxyAircraftModel";
import { UH60ExteriorModel } from "./UH60ExteriorModel";
import { MaintenanceInternalOverlay } from "./maintenance/MaintenanceInternalOverlay";
import { CameraController } from "./CameraController";
import { HighlightController } from "./HighlightController";
import { XRayController } from "./XRayController";
import { MaintenancePath } from "./MaintenancePath";
import { ObjectLabel } from "./ObjectLabel";
import { publicUrl } from "../utils/publicUrl";
import { labelComponent } from "../services/displayLabels";
import { MAINTENANCE_OBJECTS } from "./maintenance/maintenanceRegistry";

function resolveGlbPath(envPath?: string): string {
  const fallback = "models/sikorsky_uh-60m_blackhawk.glb";
  const raw = (envPath ?? "").trim() || fallback;
  if (/^https?:\/\//i.test(raw)) return raw;
  return publicUrl(raw);
}

class ModelErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function ModelSwitcher() {
  // Prefer UH-60 exterior unless explicitly forced to proxy.
  const preferProxy = import.meta.env.VITE_USE_PROXY_MODEL === "true";
  const glbPath = resolveGlbPath(import.meta.env.VITE_GLTF_MODEL_PATH);
  const [useProxy, setUseProxy] = useState(preferProxy);
  const setModelWarning = useAppStore((s) => s.setModelWarning);

  const highlightedObjects = useAppStore((s) => s.highlightedObjects);
  const hiddenObjects = useAppStore((s) => s.hiddenObjects);
  const transparentObjects = useAppStore((s) => s.transparentObjects);
  const openedPanels = useAppStore((s) => s.openedPanels);
  const selectObject = useAppStore((s) => s.selectObject);

  const props = {
    selectedObjectIds: highlightedObjects,
    hiddenObjectIds: hiddenObjects,
    transparentObjectIds: transparentObjects,
    openedPanelIds: openedPanels,
    onObjectClick: selectObject,
  };

  if (useProxy) {
    return <ProxyAircraftModel {...props} />;
  }

  return (
    <ModelErrorBoundary
      onError={() => {
        if (import.meta.env.DEV) {
          console.warn("UH-60 exterior GLB load failed — using proxy exterior.");
        }
        setModelWarning(null);
        setUseProxy(true);
      }}
    >
      <Suspense fallback={<ProxyAircraftModel {...props} />}>
        <UH60ExteriorModel url={glbPath} {...props} />
        <MaintenanceInternalOverlay {...props} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

function labelPositionForHighlight(
  id: string,
): [number, number, number] | null {
  const map: Record<string, [number, number, number]> = {
    OIL_FILTER: [0.95, 2.05, 0.22],
    OIL_PUMP: [0.42, 1.95, -0.18],
    PRESSURE_SENSOR: [1.12, 2.2, 0.06],
    ENGINE_BLOCK: [0.55, 2.25, 0],
    OIL_PIPE_MAIN: [0.75, 2.0, 0.05],
    HYDRAULIC_PUMP: [0.18, 1.45, 0],
    HYDRAULIC_SENSOR: [0.42, 1.55, 0.22],
    HYDRAULIC_LINE: [0.25, 1.4, 0.1],
    GENERATOR: [-0.45, 1.95, 0.4],
    GENERATOR_WIRING: [-0.25, 1.95, 0.35],
  };
  return map[id] ?? null;
}

export function AircraftScene() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const viewTargetId = useAppStore((s) => s.viewTargetId);
  const diagnosisResult = useAppStore((s) => s.diagnosisResult);
  const highlightedObjects = useAppStore((s) => s.highlightedObjects);

  let label: {
    pos: [number, number, number];
    title: string;
    subtitle?: string;
  } | null = null;

  const primaryHighlight =
    highlightedObjects.find((id) => id in MAINTENANCE_OBJECTS) ??
    highlightedObjects[0];

  if (primaryHighlight && primaryHighlight in MAINTENANCE_OBJECTS) {
    const pos = labelPositionForHighlight(primaryHighlight);
    if (pos) {
      label = {
        pos,
        title: labelComponent(primaryHighlight),
        subtitle: "우선 점검 대상",
      };
    }
  } else if (
    viewTargetId !== "AIRCRAFT_OVERVIEW" &&
    diagnosisResult?.system_code
  ) {
    const sys = diagnosisResult.system_code;
    const pos: [number, number, number] =
      sys === "HYDRAULIC"
        ? [0.2, 1.55, 0]
        : sys === "ELECTRICAL"
          ? [-0.4, 2.0, 0.4]
          : [0.55, 2.35, 0];
    label = {
      pos,
      title:
        sys === "HYDRAULIC"
          ? "유압계통"
          : sys === "ELECTRICAL"
            ? "전기계통"
            : "엔진 오일계통",
      subtitle: "정비 점검 위치",
    };
  }

  return (
    <>
      <color attach="background" args={["#0f172a"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 10, 4]} intensity={1.1} castShadow />
      <hemisphereLight intensity={0.35} groundColor="#1e293b" />
      <Environment preset="city" />
      <ModelSwitcher />
      {label ? (
        <ObjectLabel
          position={label.pos}
          title={label.title}
          subtitle={label.subtitle}
        />
      ) : null}
      <MaintenancePath visible={viewTargetId !== "AIRCRAFT_OVERVIEW"} />
      <ContactShadows opacity={0.35} scale={16} blur={2.5} far={8} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        maxPolarAngle={Math.PI * 0.49}
        minDistance={1.5}
        maxDistance={20}
      />
      <CameraController controlsRef={controlsRef} />
      <HighlightController />
      <XRayController />
    </>
  );
}
