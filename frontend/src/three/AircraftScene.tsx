import { Suspense, useRef, useState, Component, type ReactNode } from "react";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useAppStore } from "../stores/useAppStore";
import { ProxyAircraftModel } from "./ProxyAircraftModel";
import { GLBAircraftModel } from "./GLBAircraftModel";
import { CameraController } from "./CameraController";
import { HighlightController } from "./HighlightController";
import { XRayController } from "./XRayController";
import { MaintenancePath } from "./MaintenancePath";
import { ObjectLabel } from "./ObjectLabel";
import { AreaModelLoader } from "./AreaModelLoader";
import { publicUrl } from "../utils/publicUrl";

function resolveGlbPath(envPath?: string): string {
  const fallback = "models/aircraft_maintenance_demo.glb";
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
  const preferProxy = import.meta.env.VITE_USE_PROXY_MODEL !== "false";
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
    return (
      <>
        <ProxyAircraftModel {...props} />
        <AreaModelLoader />
      </>
    );
  }

  return (
    <ModelErrorBoundary
      onError={() => {
        setModelWarning("GLB 로딩 실패 — 프록시 모델로 전환했습니다.");
        setUseProxy(true);
      }}
    >
      <Suspense fallback={<ProxyAircraftModel {...props} />}>
        <GLBAircraftModel url={glbPath} {...props} />
        <AreaModelLoader />
      </Suspense>
    </ModelErrorBoundary>
  );
}

export function AircraftScene() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const viewTargetId = useAppStore((s) => s.viewTargetId);
  const diagnosisResult = useAppStore((s) => s.diagnosisResult);
  const highlightedObjects = useAppStore((s) => s.highlightedObjects);
  const activeAreaId = useAppStore((s) => s.activeAreaId);
  const activeFault = useAppStore((s) => s.activeFault);

  let label: {
    pos: [number, number, number];
    title: string;
    subtitle?: string;
  } | null = null;

  if (
    highlightedObjects.includes("OIL_FILTER") ||
    highlightedObjects.includes("AREA_01_PART_01")
  ) {
    label = {
      pos: [0.95, 2.2, 0.22],
      title: activeFault?.fault.target_mesh ?? "오일 필터",
      subtitle: "우선 점검 대상",
    };
  } else if (
    viewTargetId === "ENGINE_OIL_SYSTEM" ||
    viewTargetId === "ENGINE_ACCESS_PANEL" ||
    activeAreaId === "AREA_01"
  ) {
    label = {
      pos: [0.7, 2.5, 0],
      title: activeFault?.area.label_ko ?? "엔진 · 오일계통",
      subtitle: diagnosisResult
        ? "정비 점검 위치"
        : (activeAreaId ?? "접근 구역"),
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
