import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useAppStore } from "../../stores/useAppStore";
import {
  ENGINE_LEFT_ANCHOR,
  ENGINE_RIGHT_ANCHOR,
  worldFromPrimaryRel,
  ENGINE_REL,
} from "./maintenanceAnchors";

/**
 * Soft zone marker after diagnosis (EXTERIOR) — large invisible hit area
 * enters SYSTEM in one click (no need to aim at tiny marker).
 */
export function EngineZoneMarker() {
  const level = useAppStore((s) => s.inspectionLevel);
  const active = useAppStore((s) => s.activeMaintenanceSystem);
  const system = useAppStore((s) => s.inspectionSystem);
  const diagnosis = useAppStore((s) => s.diagnosisResult);
  const selectObject = useAppStore((s) => s.selectObject);
  const recommended = useAppStore((s) => s.recommendedMaintenancePart);
  const hovered = useAppStore((s) => s.hoveredMaintenancePart);
  const setHovered = useAppStore((s) => s.setHoveredMaintenancePart);

  if (level !== "EXTERIOR") return null;
  if (
    active !== "ENGINE_OIL" &&
    system !== "ENGINE_OIL" &&
    diagnosis?.system_code !== "ENGINE_OIL"
  ) {
    return null;
  }

  const tip = ENGINE_LEFT_ANCHOR;
  const mid: [number, number, number] = [
    (ENGINE_LEFT_ANCHOR[0] + ENGINE_RIGHT_ANCHOR[0]) / 2,
    ENGINE_LEFT_ANCHOR[1] + 0.05,
    (ENGINE_LEFT_ANCHOR[2] + ENGINE_RIGHT_ANCHOR[2]) / 2,
  ];
  const hint =
    recommended === "PRESSURE_SENSOR"
      ? worldFromPrimaryRel(ENGINE_REL.PRESSURE_SENSOR)
      : tip;
  const zoneHovered = hovered === "ENGINE_ZONE";

  return (
    <group name="ENGINE_ZONE_MARKERS">
      {/* Large invisible engine-bay hit volume */}
      <mesh
        name="ENGINE_ZONE_HIT_AREA"
        position={mid}
        onClick={(e) => {
          e.stopPropagation();
          selectObject("ENGINE_ZONE_HIT_AREA");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          setHovered("ENGINE_ZONE");
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
          setHovered(null);
        }}
      >
        <boxGeometry args={[1.35, 0.55, 1.15]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh
        name="ENGINE_ZONE_MARKER"
        position={tip}
        onClick={(e) => {
          e.stopPropagation();
          selectObject("ENGINE_ZONE");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          setHovered("ENGINE_ZONE");
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
          setHovered(null);
        }}
      >
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#d97706"
          emissiveIntensity={zoneHovered ? 1.15 : 0.85}
          transparent
          opacity={0.95}
        />
      </mesh>
      <mesh position={tip} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, zoneHovered ? 0.17 : 0.14, 32]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={zoneHovered ? 0.75 : 0.55}
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
      {zoneHovered ? (
        <Html
          position={[mid[0], mid[1] + 0.35, mid[2]]}
          center
          distanceFactor={12}
          style={{ pointerEvents: "none" }}
        >
          <div className="rounded bg-slate-950/85 px-1.5 py-0.5 text-[8px] text-amber-100 whitespace-nowrap ring-1 ring-amber-500/50">
            엔진 구역 · 클릭하여 내부 보기
          </div>
        </Html>
      ) : (
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
      )}
      <mesh position={ENGINE_RIGHT_ANCHOR}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color="#64748b" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}
