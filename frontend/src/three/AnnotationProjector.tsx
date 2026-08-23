import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "../stores/useAppStore";
import { buildAnnotationsForActiveSystem } from "./maintenance/maintenanceAnnotations";
import { useAnnotationStore } from "./annotationStore";

/**
 * Publishes world→screen projections each frame for side-rail callouts.
 * Specs are filtered strictly by activeMaintenanceSystem.
 */
export function AnnotationProjector() {
  const { camera, size } = useThree();
  const level = useAppStore((s) => s.inspectionLevel);
  const part = useAppStore((s) => s.selectedMaintenancePart);
  const recommended = useAppStore((s) => s.recommendedMaintenancePart);
  const hovered = useAppStore((s) => s.hoveredMaintenancePart);
  const active = useAppStore((s) => s.activeMaintenanceSystem);
  const setSpecs = useAnnotationStore((s) => s.setSpecs);
  const setScreens = useAnnotationStore((s) => s.setScreens);

  const specs = useMemo(
    () =>
      buildAnnotationsForActiveSystem({
        active,
        level,
        selectedPart: part,
        recommendedPart: recommended,
        hoveredPart: hovered,
      }).map((s) => {
        // Prefer rail on the same side as the target in world X (left = −X)
        const preferLeft = s.world[0] < 0;
        return { ...s, side: preferLeft ? ("left" as const) : ("right" as const) };
      }),
    [active, level, part, recommended, hovered],
  );

  useEffect(() => {
    setSpecs(specs);
    if (specs.length === 0) setScreens({});
  }, [specs, setSpecs, setScreens]);

  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (specs.length === 0) return;
    const next: Record<
      string,
      { id: string; x: number; y: number; visible: boolean }
    > = {};
    for (const s of specs) {
      v.set(s.world[0], s.world[1], s.world[2]);
      v.project(camera);
      const visible = v.z < 1 && v.z > -1;
      next[s.id] = {
        id: s.id,
        x: (v.x * 0.5 + 0.5) * size.width,
        y: (-v.y * 0.5 + 0.5) * size.height,
        visible,
      };
    }
    setScreens(next);
  });

  return null;
}
