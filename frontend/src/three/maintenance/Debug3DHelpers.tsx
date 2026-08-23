import { useEffect, useMemo } from "react";
import { Box3Helper } from "three";
import * as THREE from "three";
import {
  ENGINE_LEFT_ANCHOR,
  ENGINE_RIGHT_ANCHOR,
  ENGINE_LEFT_ROTATION,
  ENGINE_RIGHT_ROTATION,
  GEARBOX_ANCHOR,
  HYDRAULIC_ANCHOR,
  GENERATOR_ANCHOR,
  MAINTENANCE_ANCHORS,
} from "./maintenanceAnchors";
import { ENGINE_ASSEMBLY_SCALE, UH60_FIT } from "./uh60Fit";

export function isDebug3DEnabled(): boolean {
  return import.meta.env.VITE_DEBUG_3D === "true";
}

function AnchorMarker({
  position,
  color,
}: {
  position: [number, number, number];
  label: string;
  color: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color={color} depthTest={false} />
      </mesh>
    </group>
  );
}

function BBoxHelper({
  min,
  max,
  color,
}: {
  min: [number, number, number];
  max: [number, number, number];
  color: string;
}) {
  const helper = useMemo(() => {
    const box = new THREE.Box3(
      new THREE.Vector3(...min),
      new THREE.Vector3(...max),
    );
    return new Box3Helper(box, color);
  }, [min, max, color]);
  return <primitive object={helper} />;
}

function EngineAssemblyDebug({
  position,
  rotation,
  color,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
}) {
  const s = ENGINE_ASSEMBLY_SCALE;
  const halfL = 0.28 * s;
  const halfR = 0.12 * s;
  const forward = useMemo(
    () =>
      new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, 0),
        0.35 * s,
        color,
        0.08,
        0.05,
      ),
    [s, color],
  );
  return (
    <group position={position} rotation={rotation}>
      <BBoxHelper
        min={[-halfR, -halfR, -halfL]}
        max={[halfR, halfR, halfL]}
        color={color}
      />
      <primitive object={forward} />
      <axesHelper args={[0.2 * s]} />
    </group>
  );
}

/** DEV-only helpers for aligning maintenance overlays to UH-60 exterior. */
export function Debug3DHelpers() {
  useEffect(() => {
    if (!isDebug3DEnabled()) return;
    // eslint-disable-next-line no-console
    console.info("[DEBUG_3D] maintenance anchors", MAINTENANCE_ANCHORS);
    // eslint-disable-next-line no-console
    console.info("[DEBUG_3D] UH60_FIT", UH60_FIT);
    // eslint-disable-next-line no-console
    console.info("[DEBUG_3D] ENGINE_ASSEMBLY_SCALE", ENGINE_ASSEMBLY_SCALE);
  }, []);

  if (!isDebug3DEnabled()) return null;

  return (
    <group name="DEBUG_3D">
      <gridHelper args={[12, 24, "#64748b", "#334155"]} position={[0, 0.01, 0]} />
      <axesHelper args={[2.5]} />
      <BBoxHelper
        min={UH60_FIT.bboxMin}
        max={UH60_FIT.bboxMax}
        color="#38bdf8"
      />
      <AnchorMarker position={ENGINE_LEFT_ANCHOR} label="ENGINE_LEFT" color="#f59e0b" />
      <AnchorMarker position={ENGINE_RIGHT_ANCHOR} label="ENGINE_RIGHT" color="#fbbf24" />
      <AnchorMarker position={GEARBOX_ANCHOR} label="GEARBOX" color="#a78bfa" />
      <AnchorMarker position={HYDRAULIC_ANCHOR} label="HYDRAULIC" color="#22d3ee" />
      <AnchorMarker position={GENERATOR_ANCHOR} label="GENERATOR" color="#a3e635" />
      <AnchorMarker
        position={UH60_FIT.mainRotorHub}
        label="ROTOR_HUB"
        color="#e879f9"
      />
      <EngineAssemblyDebug
        position={ENGINE_LEFT_ANCHOR}
        rotation={ENGINE_LEFT_ROTATION}
        color="#f97316"
      />
      <EngineAssemblyDebug
        position={ENGINE_RIGHT_ANCHOR}
        rotation={ENGINE_RIGHT_ROTATION}
        color="#eab308"
      />
    </group>
  );
}

/** Log click probes for exterior / overlay meshes when debug is on. */
export function logDebugPick(
  object: THREE.Object3D,
  point: THREE.Vector3,
): void {
  if (!isDebug3DEnabled()) return;
  const local = object.worldToLocal(point.clone());
  // eslint-disable-next-line no-console
  console.info("[DEBUG_3D] pick", {
    name: object.name || "(unnamed)",
    world: point.toArray().map((n) => Number(n.toFixed(3))),
    local: local.toArray().map((n) => Number(n.toFixed(3))),
  });
}
