import { EngineAssemblyModel } from "./EngineAssemblyModel";
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
};

/**
 * Twin engines under powertrain parent — No.1 primary, No.2 context.
 */
export function EngineSystemModel(props: SystemProps) {
  const level = useAppStore((s) => s.inspectionLevel);
  const assembly = useAppStore((s) => s.selectedAssembly);

  const focusLeft =
    !assembly || assembly === "ENGINE_LEFT" || level === "SYSTEM";
  const rightMuted =
    level === "ASSEMBLY" || level === "COMPONENT"
      ? assembly !== "ENGINE_RIGHT"
      : false;
  const leftMuted =
    level === "ASSEMBLY" || level === "COMPONENT"
      ? assembly === "ENGINE_RIGHT"
      : false;

  return (
    <group name="ENGINE_SYSTEM">
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
        <EngineAssemblyModel
          {...props}
          withOilSystem={false}
          muted={rightMuted}
          primary={false}
          selectedIds={new Set()}
          hiddenIds={new Set()}
          transparentIds={new Set()}
          onObjectClick={() => undefined}
        />
        {level === "SYSTEM" ? (
          <mesh
            name="ENGINE_RIGHT_HIT_AREA"
            rotation={[Math.PI / 2, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              props.onObjectClick("ENGINE_RIGHT_HIT_AREA");
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
          >
            <cylinderGeometry args={[0.26, 0.26, 0.7, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        ) : null}
      </group>
    </group>
  );
}
