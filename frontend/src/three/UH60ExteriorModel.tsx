import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { AircraftModelProps } from "../types/diagnosis";
import {
  EXTERIOR_TRANSPARENCY_TOKENS,
  isRawExteriorMeshName,
} from "./maintenance/maintenanceRegistry";
import {
  EXTERIOR_OPACITY_BY_LEVEL,
  ROTOR_EXTRA_OPACITY_FACTOR,
  EXTERIOR_RENDER_ORDER,
  UH60_TARGET_SIZE,
} from "./maintenance/uh60Fit";
import { isDebug3DEnabled, logDebugPick } from "./maintenance/Debug3DHelpers";
import { useAppStore } from "../stores/useAppStore";

interface UH60ExteriorModelProps extends AircraftModelProps {
  url: string;
  targetSize?: number;
}

/**
 * UH-60 exterior visualization only.
 * Ghost opacity follows inspectionLevel (drill-down).
 */
export function UH60ExteriorModel({
  url,
  transparentObjectIds,
  onObjectClick,
  targetSize = UH60_TARGET_SIZE,
}: UH60ExteriorModelProps) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const inspectionLevel = useAppStore((s) => s.inspectionLevel);

  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const longest = Math.max(size.x, size.y, size.z, 0.001);
    const scale = targetSize / longest;
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
    const forceGhost =
      inspectionLevel !== "EXTERIOR" ||
      transparentObjectIds.some((id) => EXTERIOR_TRANSPARENCY_TOKENS.has(id));
    const baseOpacity = forceGhost
      ? EXTERIOR_OPACITY_BY_LEVEL[
          inspectionLevel === "EXTERIOR" ? "SYSTEM" : inspectionLevel
        ]
      : 1;
    const rotorFactor = ROTOR_EXTRA_OPACITY_FACTOR[inspectionLevel];

    cloned.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.renderOrder = EXTERIOR_RENDER_ORDER;
      obj.raycast =
        inspectionLevel === "EXTERIOR"
          ? THREE.Mesh.prototype.raycast
          : () => undefined;

      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      const localBox = new THREE.Box3().setFromObject(obj);
      const localCenter = localBox.getCenter(new THREE.Vector3());
      const worldY = localCenter.y * fit.scale + fit.position[1];
      const isHigh = worldY > 1.65;

      mats.forEach((raw) => {
        if (!raw || typeof raw !== "object") return;
        const mat = raw as THREE.MeshStandardMaterial & {
          userData: Record<string, unknown>;
        };
        if (mat.userData.__baseOpacity == null) {
          mat.userData.__baseOpacity = mat.opacity ?? 1;
          mat.userData.__baseTransparent = Boolean(mat.transparent);
          mat.userData.__baseDepthWrite = mat.depthWrite ?? true;
          mat.userData.__baseColor = mat.color?.clone?.() ?? null;
        }
        if (forceGhost) {
          mat.transparent = true;
          mat.opacity = baseOpacity * (isHigh ? rotorFactor : 1);
          if (mat.color && mat.userData.__baseColor instanceof THREE.Color) {
            mat.color
              .copy(mat.userData.__baseColor as THREE.Color)
              .lerp(new THREE.Color("#1e293b"), 0.55);
          }
          mat.depthWrite = false;
        } else {
          mat.transparent = Boolean(mat.userData.__baseTransparent);
          mat.opacity = (mat.userData.__baseOpacity as number) ?? 1;
          if (mat.color && mat.userData.__baseColor instanceof THREE.Color) {
            mat.color.copy(mat.userData.__baseColor as THREE.Color);
          }
          mat.depthWrite = (mat.userData.__baseDepthWrite as boolean) ?? true;
        }
        mat.needsUpdate = true;
      });
    });
  }, [cloned, transparentObjectIds, inspectionLevel, fit]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (inspectionLevel !== "EXTERIOR") return;
    e.stopPropagation();
    logDebugPick(e.object, e.point);
    // Upper-deck click → engine zone drill-down
    if (e.point.y > 1.35 && Math.abs(e.point.z) < 1.2) {
      onObjectClick("ENGINE_ZONE");
      return;
    }
    let obj: THREE.Object3D | null = e.object;
    while (obj) {
      if (obj.name && !isRawExteriorMeshName(obj.name)) {
        onObjectClick(obj.name);
        break;
      }
      if (obj.name && isRawExteriorMeshName(obj.name)) {
        if (isDebug3DEnabled()) {
          // eslint-disable-next-line no-console
          console.info("[DEBUG_3D] exterior mesh", obj.name);
        }
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

/** @deprecated Prefer UH60ExteriorModel */
export function GLBAircraftModel(props: UH60ExteriorModelProps) {
  return <UH60ExteriorModel {...props} />;
}
