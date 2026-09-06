import { GEARBOX_ANCHOR } from "./maintenanceAnchors";
import { INTERNAL_RENDER_ORDER } from "./uh60Fit";

/**
 * Main gearbox housing — visual hub for twin engine outputs → mast.
 * Context-only prototype (not exact CAD).
 */
export function MainGearboxModel({ opacity = 1 }: { opacity?: number }) {
  const mat = (color: string, metal = 0.55, rough = 0.38) => (
    <meshStandardMaterial
      color={color}
      metalness={metal}
      roughness={rough}
      transparent={opacity < 0.99}
      opacity={opacity}
      depthWrite={opacity > 0.45}
    />
  );

  return (
    <group
      name="MAIN_GEARBOX"
      position={GEARBOX_ANCHOR}
      renderOrder={INTERNAL_RENDER_ORDER}
    >
      {/* Lower case */}
      <mesh position={[0, -0.04, 0]} castShadow>
        <boxGeometry args={[0.32, 0.14, 0.3]} />
        {mat("#374151", 0.55, 0.4)}
      </mesh>
      {/* Round upper housing */}
      <mesh castShadow>
        <cylinderGeometry args={[0.13, 0.14, 0.16, 20]} />
        {mat("#1f2937", 0.62, 0.32)}
      </mesh>
      {/* Side input flanges */}
      <mesh position={[-0.14, -0.01, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.045, 0.05, 0.06, 12]} />
        {mat("#4b5563", 0.58, 0.35)}
      </mesh>
      <mesh position={[0.14, -0.01, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.045, 0.05, 0.06, 12]} />
        {mat("#4b5563", 0.58, 0.35)}
      </mesh>
      {/* Top mast interface ring */}
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.055, 0.014, 8, 18]} />
        {mat("#111827", 0.65, 0.3)}
      </mesh>
      {/* Forward accessory bulge */}
      <mesh position={[0, 0.02, 0.12]} castShadow>
        <boxGeometry args={[0.14, 0.1, 0.1]} />
        {mat("#27272a", 0.5, 0.42)}
      </mesh>
    </group>
  );
}
