import { EngineAssemblyModel } from "./EngineAssemblyModel";
import { CentralDriveVisual } from "./CentralDriveVisual";
import {
  ENGINE_LEFT_ANCHOR,
  ENGINE_RIGHT_ANCHOR,
  ENGINE_LEFT_ROTATION,
  ENGINE_RIGHT_ROTATION,
} from "./maintenanceAnchors";
import { ENGINE_ASSEMBLY_SCALE } from "./uh60Fit";
import { useAppStore } from "../../stores/useAppStore";

type SystemProps = {
  selectedIds: Set<string>;
  hiddenIds: Set<string>;
  transparentIds: Set<string>;
  onObjectClick: (id: string) => void;
  dimNonSelected?: boolean;
};

/**
 * Twin engine bay + central drive. Left = No.1 (primary).
 */
export function EngineOilSystemModel(props: SystemProps) {
  const level = useAppStore((s) => s.inspectionLevel);
  const assembly = useAppStore((s) => s.selectedAssembly);
  if (level === "EXTERIOR") return null;

  const focusLeft =
    !assembly || assembly === "ENGINE_LEFT" || level === "SYSTEM";
  const rightMuted =
    level === "ASSEMBLY" || level === "COMPONENT"
      ? assembly !== "ENGINE_RIGHT"
      : level === "SYSTEM"
        ? false
        : true;
  const leftMuted =
    level === "ASSEMBLY" || level === "COMPONENT"
      ? assembly === "ENGINE_RIGHT"
      : false;

  const driveOpacity =
    level === "COMPONENT" ? 0.45 : level === "ASSEMBLY" ? 0.7 : 1;

  return (
    <group name="ENGINE_OIL_SYSTEM_OVERLAY">
      <CentralDriveVisual opacity={driveOpacity} />
      <group
        name="ENGINE_LEFT_ANCHOR"
        position={ENGINE_LEFT_ANCHOR}
        rotation={ENGINE_LEFT_ROTATION}
        scale={ENGINE_ASSEMBLY_SCALE}
      >
        <EngineAssemblyModel
          {...props}
          withOilSystem={focusLeft}
          muted={leftMuted}
          primary
        />
      </group>
      <group
        name="ENGINE_RIGHT_ANCHOR"
        position={ENGINE_RIGHT_ANCHOR}
        rotation={ENGINE_RIGHT_ROTATION}
        scale={ENGINE_ASSEMBLY_SCALE}
      >
        <group>
          <EngineAssemblyModel
            {...props}
            withOilSystem={false}
            muted={rightMuted || level !== "SYSTEM"}
            primary={false}
            selectedIds={new Set()}
            hiddenIds={new Set()}
            transparentIds={new Set()}
            onObjectClick={() => undefined}
          />
        </group>
        {level === "SYSTEM" ? (
          <mesh
            name="ENGINE_RIGHT_HIT"
            rotation={[Math.PI / 2, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              props.onObjectClick("ENGINE_RIGHT");
            }}
          >
            <cylinderGeometry args={[0.16, 0.16, 0.55, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        ) : null}
      </group>
    </group>
  );
}
