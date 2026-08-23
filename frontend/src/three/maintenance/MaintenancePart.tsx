import { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

const HIGHLIGHT = "#d97706";

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
  hovered = false,
  metalness = 0.45,
  roughness = 0.4,
  opacityScale = 1,
}: {
  color: string;
  selected: boolean;
  transparent: boolean;
  hovered?: boolean;
  metalness?: number;
  roughness?: number;
  opacityScale?: number;
}) {
  const opacity = Math.min(
    1,
    (transparent ? 0.22 : 1) * opacityScale * (selected ? 1 : hovered ? 0.95 : 1),
  );
  return (
    <meshStandardMaterial
      color={selected ? "#f59e0b" : color}
      transparent={transparent || opacity < 0.99 || selected}
      opacity={opacity}
      emissive={selected ? HIGHLIGHT : hovered ? "#78350f" : "#000000"}
      emissiveIntensity={selected ? 0.75 : hovered ? 0.25 : 0}
      depthWrite={!transparent && opacity > 0.5}
      metalness={selected ? 0.35 : metalness}
      roughness={selected ? 0.35 : roughness}
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
  interactive = true,
  hovered = false,
  dimmed: _dimmed = false,
  onHover,
}: PartVisualProps & {
  position: [number, number, number];
  rotation?: [number, number, number];
  children: React.ReactNode;
  castShadow?: boolean;
  interactive?: boolean;
  hovered?: boolean;
  dimmed?: boolean;
  onHover?: (id: string | null) => void;
}) {
  if (hidden) return null;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive) return;
    e.stopPropagation();
    onObjectClick(name);
  };

  return (
    <mesh
      name={name}
      position={position}
      rotation={rotation}
      onClick={handleClick}
      onPointerOver={
        interactive
          ? (e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
              onHover?.(name);
            }
          : undefined
      }
      onPointerOut={
        interactive
          ? () => {
              document.body.style.cursor = "auto";
              onHover?.(null);
            }
          : undefined
      }
      castShadow={castShadow}
      receiveShadow
      userData={{ hovered }}
    >
      {children}
    </mesh>
  );
}

/** Invisible larger click target for small parts */
export function HitProxy({
  name,
  radius = 0.1,
  onObjectClick,
  onHover,
}: {
  name: string;
  radius?: number;
  onObjectClick: (id: string) => void;
  onHover?: (id: string | null) => void;
}) {
  return (
    <mesh
      onClick={(e) => {
        e.stopPropagation();
        onObjectClick(name);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        onHover?.(name);
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
        onHover?.(null);
      }}
    >
      <sphereGeometry args={[radius, 12, 12]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

export function HighlightRing({ radius = 0.1 }: { radius?: number }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.85, radius * 1.15, 32]} />
      <meshBasicMaterial
        color="#f59e0b"
        transparent
        opacity={0.7}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
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
