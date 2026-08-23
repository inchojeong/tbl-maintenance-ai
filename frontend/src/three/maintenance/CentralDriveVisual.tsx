import { GEARBOX_ANCHOR, MAST_TOP, ENGINE_LEFT_ANCHOR, ENGINE_RIGHT_ANCHOR } from "./maintenanceAnchors";
import { INTERNAL_RENDER_ORDER } from "./uh60Fit";

/**
 * Illustrative central drive / transmission housing linking twin engines.
 * Not a CAD replica — visual bridge so engines do not float as isolated pods.
 */
export function CentralDriveVisual({ opacity = 1 }: { opacity?: number }) {
  const midY = GEARBOX_ANCHOR[1];
  const midZ = GEARBOX_ANCHOR[2];

  return (
    <group name="CENTRAL_DRIVE" renderOrder={INTERNAL_RENDER_ORDER}>
      {/* Main transmission housing */}
      <mesh position={GEARBOX_ANCHOR} castShadow>
        <boxGeometry args={[0.28, 0.18, 0.26]} />
        <meshStandardMaterial
          color="#4a5563"
          metalness={0.55}
          roughness={0.4}
          transparent={opacity < 0.99}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0, midY + 0.02, midZ]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 0.14, 16]} />
        <meshStandardMaterial
          color="#374151"
          metalness={0.6}
          roughness={0.35}
          transparent={opacity < 0.99}
          opacity={opacity}
        />
      </mesh>
      {/* Mast stub toward rotor */}
      <mesh
        position={[
          MAST_TOP[0],
          (GEARBOX_ANCHOR[1] + MAST_TOP[1]) / 2,
          MAST_TOP[2],
        ]}
        castShadow
      >
        <cylinderGeometry args={[0.035, 0.04, MAST_TOP[1] - GEARBOX_ANCHOR[1], 12]} />
        <meshStandardMaterial
          color="#6b7280"
          metalness={0.65}
          roughness={0.3}
          transparent={opacity < 0.99}
          opacity={opacity}
        />
      </mesh>
      {/* Output shafts toward engines */}
      <mesh
        position={[
          (ENGINE_LEFT_ANCHOR[0] + GEARBOX_ANCHOR[0]) / 2,
          midY - 0.02,
          (ENGINE_LEFT_ANCHOR[2] + midZ) / 2,
        ]}
        rotation={[0, 0.2, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.02, 0.02, 0.22, 8]} />
        <meshStandardMaterial
          color="#64748b"
          metalness={0.7}
          roughness={0.25}
          transparent={opacity < 0.99}
          opacity={opacity}
        />
      </mesh>
      <mesh
        position={[
          (ENGINE_RIGHT_ANCHOR[0] + GEARBOX_ANCHOR[0]) / 2,
          midY - 0.02,
          (ENGINE_RIGHT_ANCHOR[2] + midZ) / 2,
        ]}
        rotation={[0, -0.2, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.02, 0.02, 0.22, 8]} />
        <meshStandardMaterial
          color="#64748b"
          metalness={0.7}
          roughness={0.25}
          transparent={opacity < 0.99}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}
