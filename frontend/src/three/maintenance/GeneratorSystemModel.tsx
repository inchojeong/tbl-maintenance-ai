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

/** Generator / electrical prototype visuals — upper side fuselage. */
export function GeneratorSystemModel({
  selectedIds,
  hiddenIds,
  transparentIds,
  onObjectClick,
}: SystemProps) {
  const wireGeo = useTubeGeometry(
    [
      [-0.55, 1.55, 0.35],
      [-0.4, 1.62, 0.42],
      [-0.25, 1.7, 0.38],
      [-0.1, 1.78, 0.22],
      [0.05, 1.85, 0.05],
    ],
    0.018,
    32,
  );

  const state = (id: string) => ({
    selected: selectedIds.has(id),
    hidden: hiddenIds.has(id),
    transparent: transparentIds.has(id),
  });

  return (
    <group name="GENERATOR_SYSTEM_OVERLAY">
      <group position={[-0.45, 1.62, 0.4]}>
        <ClickableMesh
          name="GENERATOR"
          position={[0, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          {...state("GENERATOR")}
          onObjectClick={onObjectClick}
        >
          <cylinderGeometry args={[0.16, 0.16, 0.32, 20]} />
          <PartMaterial
            color="#a16207"
            selected={state("GENERATOR").selected}
            transparent={state("GENERATOR").transparent}
            metalness={0.55}
            roughness={0.3}
          />
        </ClickableMesh>
        <mesh position={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.1, 0.2, 0.22]} />
          <meshStandardMaterial color="#854d0e" metalness={0.4} roughness={0.4} />
        </mesh>
      </group>

      {!state("GENERATOR_WIRING").hidden ? (
        <mesh
          name="GENERATOR_WIRING"
          geometry={wireGeo}
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
  );
}
