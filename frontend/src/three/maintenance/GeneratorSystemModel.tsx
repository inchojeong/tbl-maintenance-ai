import {
  ClickableMesh,
  PartMaterial,
  useTubeGeometry,
} from "./MaintenancePart";
import {
  GENERATOR_ANCHOR,
  GENERATOR_REL,
} from "./maintenanceAnchors";

type SystemProps = {
  selectedIds: Set<string>;
  hiddenIds: Set<string>;
  transparentIds: Set<string>;
  onObjectClick: (id: string) => void;
  dimNonSelected?: boolean;
};

/**
 * Generator assembly — single anchor hierarchy (body → control → wiring).
 * Prototype visualization only.
 */
export function GeneratorSystemModel({
  selectedIds,
  hiddenIds,
  transparentIds,
  onObjectClick,
  dimNonSelected = false,
}: SystemProps) {
  const wireLocal = useTubeGeometry(
    GENERATOR_REL.WIRING.map((p) => [...p] as [number, number, number]),
    0.016,
    32,
  );

  const state = (id: string) => ({
    selected: selectedIds.has(id),
    hidden: hiddenIds.has(id),
    transparent: transparentIds.has(id) || (dimNonSelected && !selectedIds.has(id) && selectedIds.size > 0),
  });

  return (
    <group name="GENERATOR_SYSTEM_OVERLAY" position={GENERATOR_ANCHOR}>
      <group name="GENERATOR_ASSEMBLY">
        {/* Body */}
        {!state("GENERATOR").hidden ? (
          <ClickableMesh
            name="GENERATOR"
            position={GENERATOR_REL.BODY}
            rotation={[0, 0, Math.PI / 2]}
            {...state("GENERATOR")}
            onObjectClick={onObjectClick}
          >
            <cylinderGeometry args={[0.11, 0.11, 0.28, 20]} />
            <PartMaterial
              color="#a16207"
              selected={state("GENERATOR").selected}
              transparent={state("GENERATOR").transparent}
              metalness={0.55}
              roughness={0.3}
            />
          </ClickableMesh>
        ) : null}

        {/* Control / connector — attached to body */}
        {!state("GENERATOR_CONTROL").hidden ? (
          <ClickableMesh
            name="GENERATOR_CONTROL"
            position={GENERATOR_REL.CONTROL}
            {...state("GENERATOR_CONTROL")}
            onObjectClick={onObjectClick}
          >
            <boxGeometry args={[0.1, 0.12, 0.14]} />
            <PartMaterial
              color="#854d0e"
              selected={state("GENERATOR_CONTROL").selected}
              transparent={state("GENERATOR_CONTROL").transparent}
              metalness={0.4}
              roughness={0.4}
            />
          </ClickableMesh>
        ) : null}

        {/* Mount flange under body */}
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.16, 0.04, 0.18]} />
          <meshStandardMaterial
            color="#713f12"
            metalness={0.5}
            roughness={0.45}
            transparent={dimNonSelected && selectedIds.size > 0}
            opacity={dimNonSelected && selectedIds.size > 0 ? 0.45 : 1}
          />
        </mesh>

        {/* Wiring — continuous from control outward */}
        {!state("GENERATOR_WIRING").hidden ? (
          <mesh
            name="GENERATOR_WIRING"
            geometry={wireLocal}
            onClick={(e) => {
              e.stopPropagation();
              onObjectClick("GENERATOR_WIRING");
            }}
          >
            <PartMaterial
              color="#eab308"
              selected={state("GENERATOR_WIRING").selected}
              transparent={state("GENERATOR_WIRING").transparent}
              metalness={0.2}
              roughness={0.55}
            />
          </mesh>
        ) : null}
      </group>
    </group>
  );
}
