import { useTubeGeometry } from "./MaintenancePart";
import {
  DRIVE_SHAFT_LEFT_PATH,
  DRIVE_SHAFT_RIGHT_PATH,
} from "./maintenanceAnchors";
import { INTERNAL_RENDER_ORDER } from "./uh60Fit";

/**
 * Left/right output shafts — engine aft → main gearbox ports.
 * Context-only (not clickable drill-down targets).
 */
export function DriveSystemModel({ opacity = 1 }: { opacity?: number }) {
  const leftGeo = useTubeGeometry(
    DRIVE_SHAFT_LEFT_PATH.map((p) => [...p] as [number, number, number]),
    0.018,
    20,
  );
  const rightGeo = useTubeGeometry(
    DRIVE_SHAFT_RIGHT_PATH.map((p) => [...p] as [number, number, number]),
    0.018,
    20,
  );

  const shaftMatProps = {
    color: "#94a3b8",
    metalness: 0.75,
    roughness: 0.22,
    transparent: opacity < 0.99,
    opacity,
    depthWrite: opacity > 0.45,
  };

  return (
    <group name="DRIVE_SYSTEM" renderOrder={INTERNAL_RENDER_ORDER}>
      <mesh name="DRIVE_SHAFT_LEFT" geometry={leftGeo} castShadow>
        <meshStandardMaterial {...shaftMatProps} />
      </mesh>
      <mesh name="DRIVE_SHAFT_RIGHT" geometry={rightGeo} castShadow>
        <meshStandardMaterial {...shaftMatProps} />
      </mesh>
      <mesh
        position={DRIVE_SHAFT_LEFT_PATH[DRIVE_SHAFT_LEFT_PATH.length - 1]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.028, 0.028, 0.05, 10]} />
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.7}
          roughness={0.28}
          transparent={opacity < 0.99}
          opacity={opacity}
        />
      </mesh>
      <mesh
        position={DRIVE_SHAFT_RIGHT_PATH[DRIVE_SHAFT_RIGHT_PATH.length - 1]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.028, 0.028, 0.05, 10]} />
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.7}
          roughness={0.28}
          transparent={opacity < 0.99}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}
