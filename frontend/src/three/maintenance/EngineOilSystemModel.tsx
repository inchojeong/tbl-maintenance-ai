import {
  ClickableMesh,
  PartMaterial,
  useTubeGeometry,
  type PartVisualProps,
} from "./MaintenancePart";

type SystemProps = Omit<PartVisualProps, "name" | "selected" | "hidden" | "transparent"> & {
  selectedIds: Set<string>;
  hiddenIds: Set<string>;
  transparentIds: Set<string>;
};

/**
 * Engine oil system prototype visuals (not exact UH-60 internals).
 * Placed in upper mid-fuselage / engine bay region of the normalized exterior.
 */
export function EngineOilSystemModel({
  selectedIds,
  hiddenIds,
  transparentIds,
  onObjectClick,
}: SystemProps) {
  const pipeGeo = useTubeGeometry(
    [
      [0.35, 1.72, -0.12],
      [0.55, 1.7, -0.08],
      [0.75, 1.72, 0.05],
      [0.95, 1.74, 0.18],
      [1.12, 1.88, 0.08],
    ],
    0.032,
  );

  const state = (id: string) => ({
    selected: selectedIds.has(id),
    hidden: hiddenIds.has(id),
    transparent: transparentIds.has(id),
  });

  return (
    <group name="ENGINE_OIL_SYSTEM_OVERLAY">
      {/* ENGINE_BLOCK — box + cylinders */}
      <group name="ENGINE_BLOCK_GROUP" position={[0.55, 1.85, 0]}>
        <ClickableMesh
          name="ENGINE_BLOCK"
          position={[0, 0, 0]}
          {...state("ENGINE_BLOCK")}
          onObjectClick={onObjectClick}
        >
          <boxGeometry args={[0.95, 0.48, 0.62]} />
          <PartMaterial
            color="#6b7280"
            selected={state("ENGINE_BLOCK").selected}
            transparent={state("ENGINE_BLOCK").transparent}
            metalness={0.55}
            roughness={0.35}
          />
        </ClickableMesh>
        <mesh position={[-0.35, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 0.22, 16]} />
          <meshStandardMaterial color="#4b5563" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.35, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 0.22, 16]} />
          <meshStandardMaterial color="#4b5563" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>

      {/* OIL_FILTER — filter can */}
      <ClickableMesh
        name="OIL_FILTER"
        position={[0.95, 1.72, 0.22]}
        {...state("OIL_FILTER")}
        onObjectClick={onObjectClick}
      >
        <cylinderGeometry args={[0.1, 0.1, 0.28, 20]} />
        <PartMaterial
          color="#c2410c"
          selected={state("OIL_FILTER").selected}
          transparent={state("OIL_FILTER").transparent}
          metalness={0.35}
          roughness={0.45}
        />
      </ClickableMesh>
      <mesh position={[0.95, 1.88, 0.22]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.04, 20]} />
        <meshStandardMaterial color="#9a3412" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* OIL_PUMP — housing + cylinder */}
      <group position={[0.42, 1.68, -0.18]}>
        <ClickableMesh
          name="OIL_PUMP"
          position={[0, 0, 0]}
          {...state("OIL_PUMP")}
          onObjectClick={onObjectClick}
        >
          <boxGeometry args={[0.22, 0.16, 0.2]} />
          <PartMaterial
            color="#1d4ed8"
            selected={state("OIL_PUMP").selected}
            transparent={state("OIL_PUMP").transparent}
            metalness={0.4}
            roughness={0.4}
          />
        </ClickableMesh>
        <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.14, 16]} />
          <meshStandardMaterial color="#2563eb" metalness={0.45} roughness={0.35} />
        </mesh>
      </group>

      {/* PRESSURE_SENSOR — small cylinder on pipe */}
      <ClickableMesh
        name="PRESSURE_SENSOR"
        position={[1.12, 1.95, 0.06]}
        {...state("PRESSURE_SENSOR")}
        onObjectClick={onObjectClick}
      >
        <cylinderGeometry args={[0.045, 0.045, 0.12, 12]} />
        <PartMaterial
          color="#ca8a04"
          selected={state("PRESSURE_SENSOR").selected}
          transparent={state("PRESSURE_SENSOR").transparent}
          metalness={0.5}
          roughness={0.3}
        />
      </ClickableMesh>

      {/* OIL_PIPE_MAIN */}
      {!state("OIL_PIPE_MAIN").hidden ? (
        <mesh
          name="OIL_PIPE_MAIN"
          geometry={pipeGeo}
          onClick={(e) => {
            e.stopPropagation();
            onObjectClick("OIL_PIPE_MAIN");
          }}
        >
          <PartMaterial
            color="#92400e"
            selected={state("OIL_PIPE_MAIN").selected}
            transparent={state("OIL_PIPE_MAIN").transparent}
            metalness={0.3}
            roughness={0.55}
          />
        </mesh>
      ) : null}
    </group>
  );
}
