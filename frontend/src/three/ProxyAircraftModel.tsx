import { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { AircraftModelProps } from "../types/diagnosis";

const BASE = {
  body: "#5a6b55",
  panel: "#3d4a52",
  metal: "#7a8790",
  filter: "#c45c26",
  pump: "#2f6fed",
  sensor: "#d4a017",
  rotor: "#2b3036",
  gear: "#4a5560",
  highlight: "#ff3b30",
};

type MeshDef = {
  name: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  args: [number, number, number] | [number, number, number, number];
  geo: "box" | "cylinder";
  color: string;
  openOffset?: [number, number, number];
};

const PARTS: MeshDef[] = [
  { name: "AIRCRAFT_BODY", position: [0, 1.2, 0], args: [4.2, 1.1, 1.4], geo: "box", color: BASE.body },
  { name: "COCKPIT", position: [1.7, 1.45, 0], args: [1.1, 0.7, 1.0], geo: "box", color: "#6d7f78" },
  { name: "ENGINE_ZONE", position: [0.7, 1.9, 0], args: [1.6, 0.9, 1.3], geo: "box", color: "#4e5c48" },
  {
    name: "ENGINE_PANEL_LEFT",
    position: [0.7, 1.9, 0.66],
    args: [1.4, 0.8, 0.08],
    geo: "box",
    color: BASE.panel,
    openOffset: [0, 0, 0.9],
  },
  {
    name: "ENGINE_PANEL_RIGHT",
    position: [0.7, 1.9, -0.66],
    args: [1.4, 0.8, 0.08],
    geo: "box",
    color: BASE.panel,
    openOffset: [0, 0, -0.9],
  },
  { name: "ENGINE_BLOCK", position: [0.7, 1.85, 0], args: [1.0, 0.55, 0.7], geo: "box", color: BASE.metal },
  { name: "OIL_FILTER", position: [0.95, 1.75, 0.22], args: [0.18, 0.28, 0.18], geo: "cylinder", color: BASE.filter },
  { name: "OIL_PUMP", position: [0.55, 1.7, -0.15], args: [0.22, 0.18, 0.22], geo: "box", color: BASE.pump },
  { name: "PRESSURE_SENSOR", position: [1.15, 1.95, 0.05], args: [0.12, 0.12, 0.12], geo: "box", color: BASE.sensor },
  { name: "OIL_PIPE_MAIN", position: [0.75, 1.72, 0.05], args: [0.55, 0.05, 0.05], geo: "box", color: "#8b5a2b" },
  /** System hotspots for non-oil public-TM scenarios (Proxy stand-ins). */
  { name: "HYDRAULIC_ZONE", position: [0.2, 1.05, 0], args: [1.2, 0.35, 0.9], geo: "box", color: "#1f6f8b" },
  { name: "ELECTRICAL_ZONE", position: [-0.4, 1.55, 0.55], args: [0.7, 0.45, 0.35], geo: "box", color: "#c9a227" },
  { name: "XMSN_ZONE", position: [0.05, 2.15, 0], args: [1.1, 0.4, 0.8], geo: "box", color: "#6b4f3a" },
  { name: "FUEL_ZONE", position: [-0.9, 1.15, 0], args: [1.0, 0.4, 1.0], geo: "box", color: "#3d6b4f" },
  { name: "MAIN_ROTOR", position: [0, 2.55, 0], args: [5.5, 0.06, 0.25], geo: "box", color: BASE.rotor },
  { name: "TAIL_ROTOR", position: [-3.2, 1.6, 0.35], args: [0.08, 0.9, 0.18], geo: "box", color: BASE.rotor },
  { name: "LANDING_GEAR_LEFT", position: [0.6, 0.35, 0.7], args: [0.12, 0.7, 0.12], geo: "cylinder", color: BASE.gear },
  { name: "LANDING_GEAR_RIGHT", position: [0.6, 0.35, -0.7], args: [0.12, 0.7, 0.12], geo: "cylinder", color: BASE.gear },
];

function PartMesh({
  def,
  selected,
  hidden,
  transparent,
  opened,
  onObjectClick,
}: {
  def: MeshDef;
  selected: boolean;
  hidden: boolean;
  transparent: boolean;
  opened: boolean;
  onObjectClick: (id: string) => void;
}) {
  const position = useMemo<[number, number, number]>(() => {
    if (opened && def.openOffset) {
      return [
        def.position[0] + def.openOffset[0],
        def.position[1] + def.openOffset[1],
        def.position[2] + def.openOffset[2],
      ];
    }
    return def.position;
  }, [def, opened]);

  if (hidden && !opened) return null;
  // when opened panels are in openedPanelIds they should be moved; if also in hidden, prefer open animation visibility
  const visible = !(hidden && !opened);

  const color = selected ? BASE.highlight : def.color;
  const opacity = transparent ? 0.22 : selected ? 0.95 : 1;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onObjectClick(def.name);
  };

  if (!visible && !opened) return null;

  return (
    <mesh
      name={def.name}
      position={position}
      rotation={def.rotation}
      onClick={handleClick}
      castShadow
      receiveShadow
    >
      {def.geo === "box" ? (
        <boxGeometry args={def.args as [number, number, number]} />
      ) : (
        <cylinderGeometry
          args={[
            def.args[0] as number,
            def.args[0] as number,
            def.args[1] as number,
            16,
          ]}
        />
      )}
      <meshStandardMaterial
        color={color}
        transparent={transparent || selected}
        opacity={opacity}
        emissive={selected ? BASE.highlight : "#000000"}
        emissiveIntensity={selected ? 0.55 : 0}
        depthWrite={!transparent}
        metalness={0.25}
        roughness={0.55}
      />
    </mesh>
  );
}

/** Proxy helicopter assembled from primitive meshes. Replaceable by GLBAircraftModel. */
export function ProxyAircraftModel({
  selectedObjectIds,
  hiddenObjectIds,
  transparentObjectIds,
  openedPanelIds,
  onObjectClick,
}: AircraftModelProps) {
  const selected = useMemo(() => new Set(selectedObjectIds), [selectedObjectIds]);
  const hidden = useMemo(() => new Set(hiddenObjectIds), [hiddenObjectIds]);
  const transparent = useMemo(
    () => new Set(transparentObjectIds),
    [transparentObjectIds],
  );
  const opened = useMemo(() => new Set(openedPanelIds), [openedPanelIds]);

  // Tail boom
  return (
    <group name="PROXY_AIRCRAFT">
      <mesh name="TAIL_BOOM" position={[-2.0, 1.25, 0]} castShadow>
        <boxGeometry args={[2.4, 0.28, 0.28]} />
        <meshStandardMaterial color={BASE.body} />
      </mesh>
      {PARTS.map((def) => {
        const isOpened = opened.has(def.name);
        const isHidden = hidden.has(def.name) && !isOpened;
        return (
          <PartMesh
            key={def.name}
            def={def}
            selected={selected.has(def.name)}
            hidden={isHidden}
            transparent={transparent.has(def.name)}
            opened={isOpened}
            onObjectClick={onObjectClick}
          />
        );
      })}
    </group>
  );
}

export const PROXY_OBJECT_NAMES = PARTS.map((p) => p.name);
