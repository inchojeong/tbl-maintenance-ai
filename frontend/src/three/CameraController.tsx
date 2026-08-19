import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { getViewTarget } from "../stores/useAppStore";
import { useAppStore } from "../stores/useAppStore";

interface Props {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

export function CameraController({ controlsRef }: Props) {
  const { camera } = useThree();
  const viewTargetId = useAppStore((s) => s.viewTargetId);
  const setCameraAnimating = useAppStore((s) => s.setCameraAnimating);
  const tweenRef = useRef<gsap.core.Timeline | null>(null);
  const lastId = useRef<string>("");

  useEffect(() => {
    if (lastId.current === viewTargetId) return;
    lastId.current = viewTargetId;

    const cfg = getViewTarget(viewTargetId);
    const controls = controlsRef.current;
    if (!controls) return;

    tweenRef.current?.kill();
    setCameraAnimating(true);
    controls.enabled = false;

    const fromPos = camera.position.clone();
    const fromTarget = controls.target.clone();
    const toPos = {
      x: cfg.cameraPosition[0],
      y: cfg.cameraPosition[1],
      z: cfg.cameraPosition[2],
    };
    const toTarget = {
      x: cfg.cameraTarget[0],
      y: cfg.cameraTarget[1],
      z: cfg.cameraTarget[2],
    };

    const proxy = {
      px: fromPos.x,
      py: fromPos.y,
      pz: fromPos.z,
      tx: fromTarget.x,
      ty: fromTarget.y,
      tz: fromTarget.z,
    };

    const tl = gsap.timeline({
      onUpdate: () => {
        camera.position.set(proxy.px, proxy.py, proxy.pz);
        controls.target.set(proxy.tx, proxy.ty, proxy.tz);
        controls.update();
      },
      onComplete: () => {
        controls.enabled = true;
        setCameraAnimating(false);
      },
    });

    tl.to(proxy, {
      px: toPos.x,
      py: toPos.y,
      pz: toPos.z,
      tx: toTarget.x,
      ty: toTarget.y,
      tz: toTarget.z,
      duration: cfg.duration ?? 1.2,
      ease: "power2.inOut",
    });

    tweenRef.current = tl;
    return () => {
      tl.kill();
    };
  }, [viewTargetId, camera, controlsRef, setCameraAnimating]);

  return null;
}
