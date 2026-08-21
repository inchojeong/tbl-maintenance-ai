import { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

const HIGHLIGHT = "#ff3b30";

export type PartVisualProps = {
  name: string;
  selected: boolean;
  hidden: boolean;
  transparent: boolean;
  onObjectClick: (id: string) => void;
};

export function PartMaterial({
  color,
  selected,
  transparent,
  metalness = 0.45,
  roughness = 0.4,
}: {
  color: string;
  selected: boolean;
  transparent: boolean;
  metalness?: number;
  roughness?: number;
}) {
  return (
    <meshStandardMaterial
      color={selected ? HIGHLIGHT : color}
      transparent={transparent || selected}
      opacity={transparent ? 0.2 : selected ? 0.95 : 1}
      emissive={selected ? HIGHLIGHT : "#000000"}
      emissiveIntensity={selected ? 0.55 : 0}
      depthWrite={!transparent}
      metalness={metalness}
      roughness={roughness}
    />
  );
}

export function ClickableMesh({
  name,
  position,
  rotation,
  selected,
  hidden,
  transparent,
  onObjectClick,
  children,
  castShadow = true,
}: PartVisualProps & {
  position: [number, number, number];
  rotation?: [number, number, number];
  children: React.ReactNode;
  castShadow?: boolean;
}) {
  if (hidden) return null;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onObjectClick(name);
  };

  return (
    <mesh
      name={name}
      position={position}
      rotation={rotation}
      onClick={handleClick}
      castShadow={castShadow}
      receiveShadow
    >
      {children}
    </mesh>
  );
}

export function useTubeGeometry(
  points: [number, number, number][],
  radius = 0.035,
  tubularSegments = 40,
) {
  return useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    return new THREE.TubeGeometry(curve, tubularSegments, radius, 8, false);
  }, [points, radius, tubularSegments]);
}
