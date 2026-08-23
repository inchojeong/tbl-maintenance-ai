import {
  ClickableMesh,
  PartMaterial,
  useTubeGeometry,
} from "./MaintenancePart";
import {
  HYDRAULIC_ANCHOR,
  HYDRAULIC_REL,
} from "./maintenanceAnchors";

type SystemProps = {
  selectedIds: Set<string>;
  hiddenIds: Set<string>;
  transparentIds: Set<string>;
  onObjectClick: (id: string) => void;
  dimNonSelected?: boolean;
};

/**
 * Hydraulic assembly — single anchor hierarchy (pump → line → sensor).
 * Prototype visualization only.
 */
export function HydraulicSystemModel({
  selectedIds,
  hiddenIds,
  transparentIds,
  onObjectClick,
  dimNonSelected = false,
}: SystemProps) {
  const lineLocal = useTubeGeometry(
    HYDRAULIC_REL.LINE.map((p) => [...p] as [number, number, number]),
    0.022,
    24,
  );

  const state = (id: string) => ({
    selected: selectedIds.has(id),
    hidden: hiddenIds.has(id),
    transparent:
      transparentIds.has(id) ||
      (dimNonSelected && !selectedIds.has(id) && selectedIds.size > 0),
  });

  return (
    <group name="HYDRAULIC_SYSTEM_OVERLAY" position={HYDRAULIC_ANCHOR}>
      <group name="HYDRAULIC_ASSEMBLY">
        {!state("HYDRAULIC_PUMP").hidden ? (
          <ClickableMesh
            name="HYDRAULIC_PUMP"
            position={HYDRAULIC_REL.PUMP}
            {...state("HYDRAULIC_PUMP")}
            onObjectClick={onObjectClick}
          >
            <cylinderGeometry args={[0.1, 0.12, 0.18, 20]} />
            <PartMaterial
              color="#0e7490"
              selected={state("HYDRAULIC_PUMP").selected}
              transparent={state("HYDRAULIC_PUMP").transparent}
              metalness={0.5}
              roughness={0.35}
            />
          </ClickableMesh>
        ) : null}

        <mesh position={[0, 0.12, 0]} castShadow>
          <boxGeometry args={[0.16, 0.06, 0.14]} />
          <meshStandardMaterial
            color="#155e75"
            metalness={0.45}
            roughness={0.4}
            transparent={dimNonSelected && selectedIds.size > 0}
            opacity={dimNonSelected && selectedIds.size > 0 ? 0.45 : 1}
          />
        </mesh>

        {!state("HYDRAULIC_SENSOR").hidden ? (
          <ClickableMesh
            name="HYDRAULIC_SENSOR"
            position={HYDRAULIC_REL.SENSOR}
            {...state("HYDRAULIC_SENSOR")}
            onObjectClick={onObjectClick}
          >
            <cylinderGeometry args={[0.035, 0.035, 0.1, 12]} />
            <PartMaterial
              color="#f59e0b"
              selected={state("HYDRAULIC_SENSOR").selected}
              transparent={state("HYDRAULIC_SENSOR").transparent}
              metalness={0.5}
              roughness={0.3}
            />
          </ClickableMesh>
        ) : null}

        {!state("HYDRAULIC_LINE").hidden ? (
          <mesh
            name="HYDRAULIC_LINE"
            geometry={lineLocal}
            onClick={(e) => {
              e.stopPropagation();
              onObjectClick("HYDRAULIC_LINE");
            }}
          >
            <PartMaterial
              color="#164e63"
              selected={state("HYDRAULIC_LINE").selected}
              transparent={state("HYDRAULIC_LINE").transparent}
              metalness={0.35}
              roughness={0.5}
            />
          </mesh>
        ) : null}
      </group>
    </group>
  );
}
