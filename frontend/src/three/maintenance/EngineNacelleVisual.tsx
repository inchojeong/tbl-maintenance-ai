import { INTERNAL_RENDER_ORDER } from "./uh60Fit";

/**
 * Continuous turboshaft-style nacelle (illustrative T700 silhouette).
 * Intake → compressor → core → turbine → output as one housing.
 */
export function EngineNacelleVisual({
  muted = false,
  accent = false,
  opacity = 1,
}: {
  muted?: boolean;
  accent?: boolean;
  opacity?: number;
}) {
  const mat = (
    color: string,
    metal = 0.55,
    rough = 0.35,
    emit = 0,
  ) => (
    <meshStandardMaterial
      color={muted ? "#4b5563" : color}
      metalness={metal}
      roughness={rough}
      transparent={opacity < 0.99}
      opacity={opacity}
      emissive={accent && !muted ? "#78350f" : "#000000"}
      emissiveIntensity={accent && !muted ? 0.12 + emit : emit}
      depthWrite={opacity > 0.5}
    />
  );

  return (
    <group name="ENGINE_NACELLE" renderOrder={INTERNAL_RENDER_ORDER}>
      {/* Air intake lip */}
      <mesh position={[0, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.095, 0.02, 10, 22]} />
        {mat("#1f2937", 0.72, 0.26)}
      </mesh>
      {/* Intake duct */}
      <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.088, 0.1, 0.1, 18]} />
        {mat("#374151", 0.62, 0.32)}
      </mesh>
      {/* Compressor */}
      <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.112, 0.14, 18]} />
        {mat("#6b7280", 0.58, 0.34)}
      </mesh>
      {/* Compressor band */}
      <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.112, 0.012, 8, 20]} />
        {mat("#52525b", 0.65, 0.3)}
      </mesh>
      {/* Core / combustion */}
      <mesh name="ENGINE_CORE" rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.115, 0.115, 0.16, 20]} />
        {mat("#52525b", 0.62, 0.3, accent ? 0.06 : 0)}
      </mesh>
      {/* Turbine */}
      <mesh position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.105, 0.09, 0.12, 18]} />
        {mat("#3f3f46", 0.6, 0.36)}
      </mesh>
      {/* Output / power turbine stub */}
      <mesh position={[0, 0, -0.22]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.065, 0.08, 16]} />
        {mat("#27272a", 0.58, 0.38)}
      </mesh>
      {/* Exhaust taper */}
      <mesh position={[0, 0, -0.29]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.055, 0.08, 14]} />
        {mat("#18181b", 0.5, 0.42)}
      </mesh>
      {/* Accessory / mount rail */}
      <mesh position={[0, -0.105, 0.02]} castShadow>
        <boxGeometry args={[0.14, 0.055, 0.36]} />
        {mat("#3f3f46", 0.45, 0.48)}
      </mesh>
      {/* Side accessory boss (filter attach cue) */}
      <mesh position={[-0.11, -0.02, 0.02]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, 0.04, 10]} />
        {mat("#4b5563", 0.5, 0.4)}
      </mesh>
    </group>
  );
}
