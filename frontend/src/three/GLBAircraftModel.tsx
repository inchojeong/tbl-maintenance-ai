import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { AircraftModelProps } from "../types/diagnosis";
import { validateObjectNames } from "./validateObjects";
import { useAppStore } from "../stores/useAppStore";

interface GLBAircraftModelProps extends AircraftModelProps {
  url: string;
}

export function GLBAircraftModel({
  url,
  selectedObjectIds,
  hiddenObjectIds,
  transparentObjectIds,
  openedPanelIds,
  onObjectClick,
}: GLBAircraftModelProps) {
  const { scene } = useGLTF(url);
  const setModelWarning = useAppStore((s) => s.setModelWarning);

  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const names: string[] = [];
    cloned.traverse((obj) => {
      if (obj.name) names.push(obj.name);
    });
    const { ok, missing } = validateObjectNames(names);
    if (!ok) {
      const msg = `GLB 필수 오브젝트 누락: ${missing.join(", ")}`;
      console.warn(msg);
      setModelWarning(msg);
    } else {
      setModelWarning(null);
    }
  }, [cloned, setModelWarning]);

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
        const mat = m;
        if (!mat.userData.__baseEmissive) {
          mat.userData.__baseEmissive = mat.emissive.clone();
          mat.userData.__baseOpacity = mat.opacity;
          mat.userData.__baseTransparent = mat.transparent;
        }
        if (selected.has(name)) {
          mat.emissive = new THREE.Color("#ff3b30");
          mat.emissiveIntensity = 0.6;
        } else {
          mat.emissive = mat.userData.__baseEmissive;
          mat.emissiveIntensity = 0;
        }
        if (transparent.has(name)) {
          mat.transparent = true;
          mat.opacity = 0.25;
          mat.depthWrite = false;
        } else {
          mat.transparent = mat.userData.__baseTransparent;
          mat.opacity = mat.userData.__baseOpacity ?? 1;
          mat.depthWrite = true;
        }
        mat.needsUpdate = true;
      });

      if (isOpened && obj.userData.__basePos) {
        obj.position.set(
          obj.userData.__basePos.x + 0.9,
          obj.userData.__basePos.y,
          obj.userData.__basePos.z,
        );
      } else if (obj.userData.__basePos) {
        obj.position.copy(obj.userData.__basePos);
      } else {
        obj.userData.__basePos = obj.position.clone();
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
