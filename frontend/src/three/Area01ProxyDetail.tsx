import { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { AircraftModelProps } from "../types/diagnosis";

/**
 * AREA_01 high-detail stand-in when Maintenance_Area_01.glb is unavailable.
 * Uses AREA_01_* names so faultResolver mapping works without legacy-only meshes.
 * Positions align with ProxyAircraftModel engine bay.
 */
export function Area01ProxyDetail({
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

  const parts: {
    name: string;
    position: [number, number, number];
    openOffset?: [number, number, number];
    args: [number, number, number];
    color: string;
    geo: "box" | "cylinder";
  }[] = [
    {
      name: "AREA_01_HOTSPOT",
      position: [0.7, 1.9, 0],
      args: [1.65, 0.95, 1.35],
      color: "#3f4f3c",
      geo: "box",
    },
    {
      name: "AREA_01_COVER_01",
      position: [0.7, 1.9, 0.68],
      openOffset: [0, 0, 0.85],
      args: [1.35, 0.75, 0.07],
      color: "#334155",
      geo: "box",
    },
    {
      name: "AREA_01_COVER_02",
      position: [0.7, 1.9, -0.68],
      openOffset: [0, 0, -0.85],
      args: [1.35, 0.75, 0.07],
      color: "#334155",
      geo: "box",
    },
    {
      name: "AREA_01_PART_01",
      position: [0.95, 1.75, 0.22],
      args: [0.2, 0.3, 0.2],
      color: "#c2410c",
      geo: "cylinder",
    },
    {
      name: "AREA_01_PART_02",
      position: [0.55, 1.7, -0.15],
      args: [0.22, 0.18, 0.22],
      color: "#2563eb",
      geo: "box",
    },
    {
      name: "AREA_01_PART_03",
      position: [1.15, 1.95, 0.05],
      args: [0.12, 0.12, 0.12],
      color: "#ca8a04",
      geo: "box",
    },
    {
      name: "AREA_01_CHECK_01",
      position: [0.95, 1.95, 0.28],
      args: [0.06, 0.06, 0.06],
      color: "#f43f5e",
      geo: "box",
    },
  ];

  return (
    <group name="AREA_01_ROOT">
      {parts.map((p) => {
        const isOpened = opened.has(p.name);
        const isHidden = hidden.has(p.name) && !isOpened;
        if (isHidden) return null;

        const pos: [number, number, number] =
          isOpened && p.openOffset
            ? [
                p.position[0] + p.openOffset[0],
                p.position[1] + p.openOffset[1],
                p.position[2] + p.openOffset[2],
              ]
            : p.position;

        const isSel = selected.has(p.name);
        const isXray = transparent.has(p.name);

        const onClick = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onObjectClick(p.name);
        };

        return (
          <mesh
            key={p.name}
            name={p.name}
            position={pos}
            onClick={onClick}
            castShadow
          >
            {p.geo === "box" ? (
              <boxGeometry args={p.args} />
            ) : (
              <cylinderGeometry args={[p.args[0], p.args[0], p.args[1], 16]} />
            )}
            <meshStandardMaterial
              color={isSel ? "#e11d48" : p.color}
              transparent={isXray || isSel}
              opacity={isXray ? 0.22 : isSel ? 0.95 : 1}
              emissive={isSel ? "#e11d48" : "#000000"}
              emissiveIntensity={isSel ? 0.55 : 0}
              depthWrite={!isXray}
              metalness={0.3}
              roughness={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}
