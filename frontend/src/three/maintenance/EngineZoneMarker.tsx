import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useAppStore } from "../../stores/useAppStore";
import {
  ENGINE_LEFT_ANCHOR,
  ENGINE_RIGHT_ANCHOR,
  worldFromPrimaryRel,
  ENGINE_REL,
} from "./maintenanceAnchors";

/** Soft zone marker after diagnosis (EXTERIOR) — click enters SYSTEM. */
export function EngineZoneMarker() {
  const level = useAppStore((s) => s.inspectionLevel);
  const active = useAppStore((s) => s.activeMaintenanceSystem);
  const system = useAppStore((s) => s.inspectionSystem);
  const diagnosis = useAppStore((s) => s.diagnosisResult);
  const selectObject = useAppStore((s) => s.selectObject);
  const recommended = useAppStore((s) => s.recommendedMaintenancePart);

  if (level !== "EXTERIOR") return null;
  if (
    active !== "ENGINE_OIL" &&
    system !== "ENGINE_OIL" &&
    diagnosis?.system_code !== "ENGINE_OIL"
  ) {
    return null;
  }

  const tip = ENGINE_LEFT_ANCHOR;
  const hint =
    recommended === "PRESSURE_SENSOR"
      ? worldFromPrimaryRel(ENGINE_REL.PRESSURE_SENSOR)
      : tip;

  return (
    <group name="ENGINE_ZONE_MARKERS">
      <mesh
        name="ENGINE_ZONE_MARKER"
        position={tip}
        onClick={(e) => {
          e.stopPropagation();
          selectObject("ENGINE_ZONE");
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#d97706"
          emissiveIntensity={0.85}
          transparent
          opacity={0.95}
        />
      </mesh>
      <mesh position={tip} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.14, 32]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {recommended ? (
        <mesh position={hint}>
          <sphereGeometry args={[0.025, 10, 10]} />
          <meshBasicMaterial color="#fcd34d" transparent opacity={0.8} />
        </mesh>
      ) : null}
      <Html
        position={[tip[0], tip[1] + 0.22, tip[2]]}
        center
        distanceFactor={10}
        style={{ pointerEvents: "none" }}
      >
        <div className="rounded bg-slate-950/80 px-1.5 py-0.5 text-[9px] text-amber-200 whitespace-nowrap ring-1 ring-amber-500/40">
          엔진 위치 · 클릭하여 투시
        </div>
      </Html>
      <mesh position={ENGINE_RIGHT_ANCHOR}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color="#64748b" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}
