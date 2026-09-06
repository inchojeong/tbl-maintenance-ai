import { MAST_BOTTOM, MAST_TOP } from "./maintenanceAnchors";
import { INTERNAL_RENDER_ORDER } from "./uh60Fit";

/**
 * Rotor mast stub from main gearbox up toward exterior main-rotor hub.
 * Blades remain on the UH-60 exterior GLB — mast only for powertrain continuity.
 */
export function RotorMastModel({ opacity = 1 }: { opacity?: number }) {
  const midY = (MAST_BOTTOM[1] + MAST_TOP[1]) / 2;
  const height = Math.max(0.08, MAST_TOP[1] - MAST_BOTTOM[1]);

  return (
    <group name="ROTOR_MAST" renderOrder={INTERNAL_RENDER_ORDER}>
      <mesh
        name="ROTOR_MAST"
        position={[MAST_TOP[0], midY, MAST_TOP[2]]}
        castShadow
      >
        <cylinderGeometry args={[0.038, 0.045, height, 14]} />
        <meshStandardMaterial
          color="#64748b"
          metalness={0.7}
          roughness={0.28}
          transparent={opacity < 0.99}
          opacity={opacity}
          depthWrite={opacity > 0.45}
        />
      </mesh>
      {/* Swashplate cue (illustrative ring) */}
      <mesh
        position={[MAST_TOP[0], MAST_TOP[1] - 0.04, MAST_TOP[2]]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.07, 0.012, 8, 16]} />
        <meshStandardMaterial
          color="#475569"
          metalness={0.6}
          roughness={0.35}
          transparent={opacity < 0.99}
          opacity={opacity * 0.95}
        />
      </mesh>
    </group>
  );
}
