import {
  ClickableMesh,
  PartMaterial,
  useTubeGeometry,
} from "./MaintenancePart";

type SystemProps = {
  selectedIds: Set<string>;
  hiddenIds: Set<string>;
  transparentIds: Set<string>;
  onObjectClick: (id: string) => void;
};

/** Hydraulic system prototype visuals — lower mid-fuselage. */
export function HydraulicSystemModel({
  selectedIds,
  hiddenIds,
  transparentIds,
  onObjectClick,
}: SystemProps) {
  const lineGeo = useTubeGeometry(
    [
      [0.05, 1.05, -0.25],
      [0.15, 1.08, -0.05],
      [0.25, 1.12, 0.15],
      [0.35, 1.18, 0.28],
      [0.48, 1.28, 0.2],
    ],
    0.028,
  );

  const state = (id: string) => ({
    selected: selectedIds.has(id),
    hidden: hiddenIds.has(id),
    transparent: transparentIds.has(id),
  });

  return (
    <group name="HYDRAULIC_SYSTEM_OVERLAY">
      <group position={[0.18, 1.12, 0]}>
        <ClickableMesh
          name="HYDRAULIC_PUMP"
          position={[0, 0, 0]}
          {...state("HYDRAULIC_PUMP")}
          onObjectClick={onObjectClick}
        >
          <cylinderGeometry args={[0.14, 0.16, 0.22, 20]} />
          <PartMaterial
            color="#0e7490"
            selected={state("HYDRAULIC_PUMP").selected}
            transparent={state("HYDRAULIC_PUMP").transparent}
            metalness={0.5}
            roughness={0.35}
          />
        </ClickableMesh>
        <mesh position={[0, 0.16, 0]} castShadow>
          <boxGeometry args={[0.2, 0.08, 0.18]} />
          <meshStandardMaterial color="#155e75" metalness={0.45} roughness={0.4} />
        </mesh>
      </group>

      <ClickableMesh
        name="HYDRAULIC_SENSOR"
        position={[0.42, 1.32, 0.22]}
        {...state("HYDRAULIC_SENSOR")}
        onObjectClick={onObjectClick}
      >
        <cylinderGeometry args={[0.04, 0.04, 0.12, 12]} />
        <PartMaterial
          color="#f59e0b"
          selected={state("HYDRAULIC_SENSOR").selected}
          transparent={state("HYDRAULIC_SENSOR").transparent}
          metalness={0.5}
          roughness={0.3}
        />
      </ClickableMesh>

      {!state("HYDRAULIC_LINE").hidden ? (
        <mesh
          name="HYDRAULIC_LINE"
          geometry={lineGeo}
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
  );
}
