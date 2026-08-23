import { INTERNAL_RENDER_ORDER } from "./uh60Fit";

/** T700-inspired nacelle with sectioned materials (illustrative). */
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
      emissiveIntensity={accent && !muted ? 0.1 + emit : emit}
      depthWrite={opacity > 0.5}
    />
  );

  return (
    <group name="ENGINE_NACELLE" renderOrder={INTERNAL_RENDER_ORDER}>
      {/* Intake */}
      <mesh position={[0, 0, 0.24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.09, 0.018, 10, 20]} />
        {mat("#1f2937", 0.7, 0.28)}
      </mesh>
      <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.085, 0.1, 0.08, 18]} />
        {mat("#374151", 0.65, 0.32)}
      </mesh>
      {/* Compressor */}
      <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.11, 0.14, 18]} />
        {mat("#6b7280", 0.58, 0.34)}
      </mesh>
      {/* Core */}
      <mesh name="ENGINE_CORE" rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.18, 20]} />
        {mat("#52525b", 0.62, 0.3, accent ? 0.05 : 0)}
      </mesh>
      {/* Turbine */}
      <mesh position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.085, 0.12, 18]} />
        {mat("#3f3f46", 0.6, 0.36)}
      </mesh>
      {/* Output / exhaust toward gearbox */}
      <mesh position={[0, 0, -0.22]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.07, 0.1, 16]} />
        {mat("#27272a", 0.55, 0.4)}
      </mesh>
      <mesh position={[0, -0.1, 0]} castShadow>
        <boxGeometry args={[0.12, 0.06, 0.28]} />
        {mat("#3f3f46", 0.45, 0.48)}
      </mesh>
    </group>
  );
}
