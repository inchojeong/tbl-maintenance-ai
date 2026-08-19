import { Suspense, useEffect, Component, type ReactNode, useMemo } from "react";
import { useGLTF, useProgress } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "../stores/useAppStore";
import { getAreaConfig } from "../services/faultResolver";
import { Area01ProxyDetail } from "./Area01ProxyDetail";
import type { AircraftModelProps } from "../types/diagnosis";
import { publicUrl } from "../utils/publicUrl";

class AreaErrorBoundary extends Component<
  { onError: () => void; children: ReactNode; resetKey: string },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function AreaLoadProgressBridge() {
  const { active, progress } = useProgress();
  const setAreaLoadProgress = useAppStore((s) => s.setAreaLoadProgress);
  useEffect(() => {
    setAreaLoadProgress(active ? Math.round(progress) : 100);
  }, [active, progress, setAreaLoadProgress]);
  return null;
}

function AreaGlbModel({
  url,
  selectedObjectIds,
  hiddenObjectIds,
  transparentObjectIds,
  openedPanelIds,
  onObjectClick,
}: AircraftModelProps & { url: string }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const setAreaLoadStatus = useAppStore((s) => s.setAreaLoadStatus);

  useEffect(() => {
    setAreaLoadStatus("ready");
  }, [cloned, setAreaLoadStatus]);

  useEffect(() => {
    const selected = new Set(selectedObjectIds);
    const hidden = new Set(hiddenObjectIds);
    const transparent = new Set(transparentObjectIds);
    const opened = new Set(openedPanelIds);

    cloned.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const name = obj.name;
      const isOpened = opened.has(name);
      obj.visible = !(hidden.has(name) && !isOpened);

      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        if (!(m instanceof THREE.MeshStandardMaterial)) return;
        if (!m.userData.__baseEmissive) {
          m.userData.__baseEmissive = m.emissive.clone();
          m.userData.__baseOpacity = m.opacity;
          m.userData.__baseTransparent = m.transparent;
        }
        if (selected.has(name)) {
          m.emissive = new THREE.Color("#e11d48");
          m.emissiveIntensity = 0.55;
        } else {
          m.emissive = m.userData.__baseEmissive;
          m.emissiveIntensity = 0;
        }
        if (transparent.has(name)) {
          m.transparent = true;
          m.opacity = 0.25;
          m.depthWrite = false;
        } else {
          m.transparent = m.userData.__baseTransparent;
          m.opacity = m.userData.__baseOpacity ?? 1;
          m.depthWrite = true;
        }
        m.needsUpdate = true;
      });

      if (!obj.userData.__basePos) {
        obj.userData.__basePos = obj.position.clone();
      }
      if (isOpened) {
        obj.position.set(
          obj.userData.__basePos.x,
          obj.userData.__basePos.y,
          obj.userData.__basePos.z + 0.45,
        );
      } else {
        obj.position.copy(obj.userData.__basePos);
      }
    });
  }, [
    cloned,
    selectedObjectIds,
    hiddenObjectIds,
    transparentObjectIds,
    openedPanelIds,
  ]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    let obj: THREE.Object3D | null = e.object;
    while (obj) {
      if (obj.name) {
        onObjectClick(obj.name);
        break;
      }
      obj = obj.parent;
    }
  };

  return <primitive object={cloned} onClick={handleClick} />;
}

function useModelProps(): AircraftModelProps {
  return {
    selectedObjectIds: useAppStore((s) => s.highlightedObjects),
    hiddenObjectIds: useAppStore((s) => s.hiddenObjects),
    transparentObjectIds: useAppStore((s) => s.transparentObjects),
    openedPanelIds: useAppStore((s) => s.openedPanels),
    onObjectClick: useAppStore((s) => s.selectObject),
  };
}

/**
 * Lazy-loads AREA_01 detail model when `activeAreaId === "AREA_01"`.
 * Uses Area01ProxyDetail when VITE_USE_PROXY_MODEL=true or GLB fails.
 */
export function AreaModelLoader() {
  const activeAreaId = useAppStore((s) => s.activeAreaId);
  const areaForceProxy = useAppStore((s) => s.areaForceProxy);
  const setAreaLoadStatus = useAppStore((s) => s.setAreaLoadStatus);
  const setAreaForceProxy = useAppStore((s) => s.setAreaForceProxy);
  const setModelWarning = useAppStore((s) => s.setModelWarning);
  const preferProxy =
    import.meta.env.VITE_USE_PROXY_MODEL !== "false" || areaForceProxy;
  const props = useModelProps();

  useEffect(() => {
    if (!activeAreaId) {
      setAreaLoadStatus("idle");
      return;
    }
    if (activeAreaId !== "AREA_01") {
      setAreaLoadStatus("idle");
      return;
    }
    setAreaLoadStatus(preferProxy ? "proxy" : "loading");
  }, [activeAreaId, preferProxy, setAreaLoadStatus]);

  if (activeAreaId !== "AREA_01") return null;

  const area = getAreaConfig("AREA_01");
  if (!area?.enabled) return null;

  const areaModelUrl = publicUrl(area.model);

  if (preferProxy) {
    return <Area01ProxyDetail {...props} />;
  }

  return (
    <AreaErrorBoundary
      resetKey={areaModelUrl}
      onError={() => {
        setModelWarning(
          "AREA_01 GLB 로드 실패 — 프록시 상세 모델로 전환했습니다.",
        );
        setAreaForceProxy(true);
        setAreaLoadStatus("proxy");
      }}
    >
      <Suspense
        fallback={
          <>
            <AreaLoadProgressBridge />
            <Area01ProxyDetail {...props} />
          </>
        }
      >
        <AreaLoadProgressBridge />
        <AreaGlbModel url={areaModelUrl} {...props} />
      </Suspense>
    </AreaErrorBoundary>
  );
}
