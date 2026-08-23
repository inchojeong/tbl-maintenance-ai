import {
  ClickableMesh,
  PartMaterial,
  useTubeGeometry,
  HitProxy,
  HighlightRing,
} from "./MaintenancePart";
import { ENGINE_REL } from "./maintenanceAnchors";
import { EngineNacelleVisual } from "./EngineNacelleVisual";
import { useAppStore } from "../../stores/useAppStore";
import type { InspectionLevel } from "../../types/diagnosis";

type SystemProps = {
  selectedIds: Set<string>;
  hiddenIds: Set<string>;
  transparentIds: Set<string>;
  onObjectClick: (id: string) => void;
  withOilSystem?: boolean;
  muted?: boolean;
  /** Primary interactive engine */
  primary?: boolean;
};

function dimFactor(
  level: InspectionLevel,
  muted: boolean,
  partSelected: boolean,
  anyComponentSelected: boolean,
): number {
  if (muted) return level === "ASSEMBLY" || level === "COMPONENT" ? 0.28 : 0.45;
  if (level === "COMPONENT" && anyComponentSelected && !partSelected) return 0.4;
  return 1;
}

/**
 * One engine assembly in local space (anchor provides world placement).
 */
export function EngineAssemblyModel({
  selectedIds,
  hiddenIds,
  transparentIds,
  onObjectClick,
  withOilSystem = true,
  muted = false,
  primary = true,
}: SystemProps) {
  const level = useAppStore((s) => s.inspectionLevel);
  const hovered = useAppStore((s) => s.hoveredMaintenancePart);
  const setHovered = useAppStore((s) => s.setHoveredMaintenancePart);
  const selectedPart = useAppStore((s) => s.selectedMaintenancePart);

  const pipeGeo = useTubeGeometry(
    [...ENGINE_REL.OIL_PIPE] as [number, number, number][],
    0.018,
    28,
  );

  const state = (id: string) => ({
    selected: selectedIds.has(id) || selectedPart === id,
    hidden: hiddenIds.has(id),
    transparent: transparentIds.has(id),
  });

  const showOil =
    withOilSystem &&
    (level === "ASSEMBLY" || level === "COMPONENT" || level === "SYSTEM");
  const oilInteractive = level === "ASSEMBLY" || level === "COMPONENT";
  const blockInteractive =
    primary && (level === "SYSTEM" || level === "ASSEMBLY" || level === "COMPONENT");

  const block = state("ENGINE_BLOCK");
  const anyComp = Boolean(selectedPart);
  const bodyDim = dimFactor(level, muted, false, anyComp);

  return (
    <group name="ENGINE_ASSEMBLY">
      <group
        onClick={
          blockInteractive
            ? (e) => {
                e.stopPropagation();
                onObjectClick("ENGINE_BLOCK");
              }
            : undefined
        }
        onPointerOver={
          blockInteractive
            ? () => {
                document.body.style.cursor = "pointer";
                setHovered("ENGINE_BLOCK");
              }
            : undefined
        }
        onPointerOut={
          blockInteractive
            ? () => {
                document.body.style.cursor = "auto";
                setHovered(null);
              }
            : undefined
        }
      >
        <EngineNacelleVisual
          muted={muted || bodyDim < 0.9}
          accent={primary && level !== "EXTERIOR" && !muted}
          opacity={bodyDim}
        />
      </group>

      {primary && blockInteractive && !block.hidden ? (
        <mesh
          name="ENGINE_LEFT_HIT"
          rotation={[Math.PI / 2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onObjectClick("ENGINE_BLOCK");
          }}
        >
          <cylinderGeometry args={[0.16, 0.16, 0.55, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}

      {showOil ? (
        <group name="OIL_SYSTEM" visible={!muted}>
          {!state("OIL_FILTER").hidden ? (
            <group position={ENGINE_REL.OIL_FILTER}>
              <ClickableMesh
                name="OIL_FILTER"
                position={[0, 0, 0]}
                {...state("OIL_FILTER")}
                dimmed={dimFactor(level, false, state("OIL_FILTER").selected, anyComp) < 0.9}
                interactive={oilInteractive}
                hovered={hovered === "OIL_FILTER"}
                onObjectClick={onObjectClick}
                onHover={setHovered}
              >
                <cylinderGeometry args={[0.05, 0.05, 0.13, 16]} />
                <PartMaterial
                  color="#b45309"
                  selected={state("OIL_FILTER").selected}
                  transparent={state("OIL_FILTER").transparent}
                  hovered={hovered === "OIL_FILTER"}
                  metalness={0.35}
                  roughness={0.45}
                  opacityScale={dimFactor(
                    level,
                    false,
                    state("OIL_FILTER").selected,
                    anyComp,
                  )}
                />
              </ClickableMesh>
              {oilInteractive ? (
                <HitProxy
                  name="OIL_FILTER"
                  radius={0.09}
                  onObjectClick={onObjectClick}
                  onHover={setHovered}
                />
              ) : null}
              {state("OIL_FILTER").selected ? (
                <HighlightRing radius={0.09} />
              ) : null}
            </group>
          ) : null}

          {!state("OIL_PUMP").hidden ? (
            <group position={ENGINE_REL.OIL_PUMP}>
              <ClickableMesh
                name="OIL_PUMP"
                position={[0, 0, 0]}
                {...state("OIL_PUMP")}
                dimmed={dimFactor(level, false, state("OIL_PUMP").selected, anyComp) < 0.9}
                interactive={oilInteractive}
                hovered={hovered === "OIL_PUMP"}
                onObjectClick={onObjectClick}
                onHover={setHovered}
              >
                <boxGeometry args={[0.1, 0.08, 0.09]} />
                <PartMaterial
                  color="#1e3a5f"
                  selected={state("OIL_PUMP").selected}
                  transparent={state("OIL_PUMP").transparent}
                  hovered={hovered === "OIL_PUMP"}
                  metalness={0.45}
                  roughness={0.4}
                  opacityScale={dimFactor(
                    level,
                    false,
                    state("OIL_PUMP").selected,
                    anyComp,
                  )}
                />
              </ClickableMesh>
              {oilInteractive ? (
                <HitProxy
                  name="OIL_PUMP"
                  radius={0.09}
                  onObjectClick={onObjectClick}
                  onHover={setHovered}
                />
              ) : null}
              {state("OIL_PUMP").selected ? <HighlightRing radius={0.09} /> : null}
            </group>
          ) : null}

          {!state("PRESSURE_SENSOR").hidden ? (
            <group position={ENGINE_REL.PRESSURE_SENSOR}>
              <ClickableMesh
                name="PRESSURE_SENSOR"
                position={[0, 0, 0]}
                {...state("PRESSURE_SENSOR")}
                dimmed={
                  dimFactor(level, false, state("PRESSURE_SENSOR").selected, anyComp) <
                  0.9
                }
                interactive={oilInteractive}
                hovered={hovered === "PRESSURE_SENSOR"}
                onObjectClick={onObjectClick}
                onHover={setHovered}
              >
                <cylinderGeometry args={[0.025, 0.025, 0.08, 12]} />
                <PartMaterial
                  color="#a16207"
                  selected={state("PRESSURE_SENSOR").selected}
                  transparent={state("PRESSURE_SENSOR").transparent}
                  hovered={hovered === "PRESSURE_SENSOR"}
                  metalness={0.55}
                  roughness={0.28}
                  opacityScale={dimFactor(
                    level,
                    false,
                    state("PRESSURE_SENSOR").selected,
                    anyComp,
                  )}
                />
              </ClickableMesh>
              {oilInteractive ? (
                <HitProxy
                  name="PRESSURE_SENSOR"
                  radius={0.1}
                  onObjectClick={onObjectClick}
                  onHover={setHovered}
                />
              ) : null}
              {state("PRESSURE_SENSOR").selected ? (
                <HighlightRing radius={0.1} />
              ) : null}
            </group>
          ) : null}

          {!state("OIL_PIPE_MAIN").hidden ? (
            <mesh
              name="OIL_PIPE_MAIN"
              geometry={pipeGeo}
              onClick={
                oilInteractive
                  ? (e) => {
                      e.stopPropagation();
                      onObjectClick("OIL_PIPE_MAIN");
                    }
                  : undefined
              }
            >
              <PartMaterial
                color="#78350f"
                selected={state("OIL_PIPE_MAIN").selected}
                transparent={state("OIL_PIPE_MAIN").transparent}
                metalness={0.3}
                roughness={0.55}
                opacityScale={dimFactor(
                  level,
                  false,
                  state("OIL_PIPE_MAIN").selected,
                  anyComp,
                )}
              />
            </mesh>
          ) : null}
        </group>
      ) : null}
    </group>
  );
}
