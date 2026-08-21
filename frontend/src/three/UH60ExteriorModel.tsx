import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { AircraftModelProps } from "../types/diagnosis";
import {
  EXTERIOR_TRANSPARENCY_TOKENS,
  isRawExteriorMeshName,
} from "./maintenance/maintenanceRegistry";

interface UH60ExteriorModelProps extends AircraftModelProps {
  url: string;
  /** Target longest-axis length after normalization (proxy-compatible). */
  targetSize?: number;
}

/**
 * UH-60 exterior visualization only.
 * Maintenance interaction lives in MaintenanceInternalOverlay — do not map Object_* to part IDs.
 */
export function UH60ExteriorModel({
  url,
  transparentObjectIds,
  onObjectClick,
  targetSize = 5.8,
}: UH60ExteriorModelProps) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const longest = Math.max(size.x, size.y, size.z, 0.001);
    const scale = targetSize / longest;
    // Lift so belly sits near ground / matches overlay Y (~1.2 body center)
    const yLift = 1.15 - center.y * scale;
    return {
      scale,
      position: [-center.x * scale, yLift, -center.z * scale] as [
        number,
        number,
        number,
      ],
    };
  }, [cloned, targetSize]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      const names: string[] = [];
      cloned.traverse((obj) => {
        if (obj.name) names.push(obj.name);
      });
      console.info(
        "[UH60Exterior] mesh names (exterior-only, not maintenance IDs):",
        [...new Set(names)].slice(0, 40),
      );
    }
  }, [cloned]);

  useEffect(() => {
    const exteriorXray = transparentObjectIds.some((id) =>
      EXTERIOR_TRANSPARENCY_TOKENS.has(id),
    );

    cloned.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((raw) => {
        if (!raw || typeof raw !== "object") return;
        const mat = raw as THREE.Material & {
          opacity?: number;
          transparent?: boolean;
          depthWrite?: boolean;
          needsUpdate?: boolean;
        };
        if (mat.userData.__baseOpacity == null) {
          mat.userData.__baseOpacity = mat.opacity ?? 1;
          mat.userData.__baseTransparent = Boolean(mat.transparent);
          mat.userData.__baseDepthWrite = mat.depthWrite ?? true;
        }
        if (exteriorXray) {
          mat.transparent = true;
          mat.opacity = 0.22;
          if ("depthWrite" in mat) mat.depthWrite = false;
        } else {
          mat.transparent = Boolean(mat.userData.__baseTransparent);
          mat.opacity = mat.userData.__baseOpacity ?? 1;
          if ("depthWrite" in mat) {
            mat.depthWrite = mat.userData.__baseDepthWrite ?? true;
          }
        }
        mat.needsUpdate = true;
      });
    });
  }, [cloned, transparentObjectIds]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    let obj: THREE.Object3D | null = e.object;
    while (obj) {
      if (obj.name && !isRawExteriorMeshName(obj.name)) {
        onObjectClick(obj.name);
        break;
      }
      // Skip Object_* — exterior click is low priority for demo
      if (obj.name && isRawExteriorMeshName(obj.name)) {
        break;
      }
      obj = obj.parent;
    }
  };

  return (
    <group
      name="UH60_EXTERIOR"
      scale={fit.scale}
      position={fit.position}
      onClick={handleClick}
    >
      <primitive object={cloned} />
    </group>
  );
}

/** @deprecated Prefer UH60ExteriorModel — kept for imports during transition. */
export function GLBAircraftModel(props: UH60ExteriorModelProps) {
  return <UH60ExteriorModel {...props} />;
}
