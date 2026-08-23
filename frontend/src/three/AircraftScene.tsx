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
import { AnnotationProjector } from "./AnnotationProjector";
import { publicUrl } from "../utils/publicUrl";
import { Debug3DHelpers } from "./maintenance/Debug3DHelpers";

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

export function AircraftScene() {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <>
      <color attach="background" args={["#0f172a"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 10, 4]} intensity={1.15} castShadow />
      <hemisphereLight intensity={0.3} groundColor="#1e293b" />
      <Environment preset="city" />
      <ModelSwitcher />
      <Debug3DHelpers />
      <AnnotationProjector />
      <ContactShadows opacity={0.3} scale={16} blur={2.5} far={8} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        maxPolarAngle={Math.PI * 0.49}
        minDistance={0.55}
        maxDistance={20}
      />
      <CameraController controlsRef={controlsRef} />
      <HighlightController />
      <XRayController />
    </>
  );
}
