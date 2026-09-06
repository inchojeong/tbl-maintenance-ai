import { Html } from "@react-three/drei";
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
  kind: "body" | "oil" = "body",
): number {
  if (muted) {
    return level === "ASSEMBLY" || level === "COMPONENT" ? 0.3 : 0.45;
  }
  if (level === "COMPONENT" && anyComponentSelected) {
    if (partSelected) return 1;
    return kind === "oil" ? 0.32 : 0.42;
  }
  // ASSEMBLY: oil parts slightly brighter than engine body
  if (level === "ASSEMBLY" && kind === "oil") return 1.08;
  return 1;
}

function hitRadiusFor(
  partId: string,
  recommended: string | null,
): number {
  const base =
    partId === "PRESSURE_SENSOR"
      ? 0.11
      : partId === "OIL_FILTER" || partId === "OIL_PUMP"
        ? 0.14
        : 0.12;
  if (recommended === partId) return base * 1.75;
  return base * 1.35;
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
  const recommended = useAppStore((s) => s.recommendedMaintenancePart);

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
    withOilSystem && (level === "ASSEMBLY" || level === "COMPONENT");
  const oilInteractive = level === "ASSEMBLY" || level === "COMPONENT";
  // SYSTEM only: engine body advances one step to ASSEMBLY (never at ASSEMBLY+)
  const blockInteractive = primary && level === "SYSTEM";

  const block = state("ENGINE_BLOCK");
  const anyComp = Boolean(selectedPart);
  const bodyDim = dimFactor(level, muted, false, anyComp, "body");
  const oilDim = (id: string) =>
    dimFactor(level, false, state(id).selected, anyComp, "oil");

  const engineHovered = hovered === "ENGINE_BLOCK" || hovered === "ENGINE_LEFT";

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
            ? (e) => {
                e.stopPropagation();
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
          name="ENGINE_LEFT_HIT_AREA"
          rotation={[Math.PI / 2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onObjectClick("ENGINE_LEFT_HIT_AREA");
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
            setHovered("ENGINE_BLOCK");
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
            setHovered(null);
          }}
        >
          <cylinderGeometry args={[0.28, 0.28, 0.72, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}

      {primary && blockInteractive && engineHovered ? (
        <Html
          position={[0, 0.22, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: "none" }}
        >
          <div className="rounded bg-slate-950/85 px-1.5 py-0.5 text-[8px] text-amber-100 whitespace-nowrap ring-1 ring-amber-500/45">
            No.1 엔진 · 클릭하여 내부 보기
          </div>
        </Html>
      ) : null}

      {showOil ? (
        <group name="OIL_SYSTEM" visible={!muted}>
          {!state("OIL_FILTER").hidden ? (
            <group position={ENGINE_REL.OIL_FILTER}>
              <ClickableMesh
                name="OIL_FILTER"
                position={[0, 0, 0]}
                {...state("OIL_FILTER")}
                dimmed={oilDim("OIL_FILTER") < 0.9}
                interactive={oilInteractive}
                hovered={hovered === "OIL_FILTER"}
                onObjectClick={onObjectClick}
                onHover={setHovered}
              >
                <cylinderGeometry args={[0.05, 0.05, 0.13, 16]} />
                <PartMaterial
                  color="#d97706"
                  selected={state("OIL_FILTER").selected}
                  transparent={state("OIL_FILTER").transparent}
                  hovered={hovered === "OIL_FILTER"}
                  metalness={0.35}
                  roughness={0.4}
                  opacityScale={oilDim("OIL_FILTER")}
                />
              </ClickableMesh>
              {oilInteractive ? (
                <HitProxy
                  name="OIL_FILTER"
                  radius={hitRadiusFor("OIL_FILTER", recommended)}
                  onObjectClick={onObjectClick}
                  onHover={setHovered}
                />
              ) : null}
              {state("OIL_FILTER").selected || hovered === "OIL_FILTER" ? (
                <HighlightRing radius={0.1} />
              ) : null}
              {hovered === "OIL_FILTER" ? (
                <Html
                  position={[0, 0.12, 0]}
                  center
                  distanceFactor={6}
                  style={{ pointerEvents: "none" }}
                >
                  <div className="rounded bg-slate-950/85 px-1 py-0.5 text-[7px] text-amber-100 whitespace-nowrap">
                    오일 필터
                  </div>
                </Html>
              ) : null}
            </group>
          ) : null}

          {!state("OIL_PUMP").hidden ? (
            <group position={ENGINE_REL.OIL_PUMP}>
              <ClickableMesh
                name="OIL_PUMP"
                position={[0, 0, 0]}
                {...state("OIL_PUMP")}
                dimmed={oilDim("OIL_PUMP") < 0.9}
                interactive={oilInteractive}
                hovered={hovered === "OIL_PUMP"}
                onObjectClick={onObjectClick}
                onHover={setHovered}
              >
                <boxGeometry args={[0.1, 0.08, 0.09]} />
                <PartMaterial
                  color="#2563eb"
                  selected={state("OIL_PUMP").selected}
                  transparent={state("OIL_PUMP").transparent}
                  hovered={hovered === "OIL_PUMP"}
                  metalness={0.45}
                  roughness={0.35}
                  opacityScale={oilDim("OIL_PUMP")}
                />
              </ClickableMesh>
              {oilInteractive ? (
                <HitProxy
                  name="OIL_PUMP"
                  radius={hitRadiusFor("OIL_PUMP", recommended)}
                  onObjectClick={onObjectClick}
                  onHover={setHovered}
                />
              ) : null}
              {state("OIL_PUMP").selected || hovered === "OIL_PUMP" ? (
                <HighlightRing radius={0.1} />
              ) : null}
              {hovered === "OIL_PUMP" ? (
                <Html
                  position={[0, 0.12, 0]}
                  center
                  distanceFactor={6}
                  style={{ pointerEvents: "none" }}
                >
                  <div className="rounded bg-slate-950/85 px-1 py-0.5 text-[7px] text-amber-100 whitespace-nowrap">
                    오일 펌프
                  </div>
                </Html>
              ) : null}
            </group>
          ) : null}

          {!state("PRESSURE_SENSOR").hidden ? (
            <group position={ENGINE_REL.PRESSURE_SENSOR}>
              <ClickableMesh
                name="PRESSURE_SENSOR"
                position={[0, 0, 0]}
                {...state("PRESSURE_SENSOR")}
                dimmed={oilDim("PRESSURE_SENSOR") < 0.9}
                interactive={oilInteractive}
                hovered={hovered === "PRESSURE_SENSOR"}
                onObjectClick={onObjectClick}
                onHover={setHovered}
              >
                <cylinderGeometry args={[0.028, 0.028, 0.09, 12]} />
                <PartMaterial
                  color="#f59e0b"
                  selected={state("PRESSURE_SENSOR").selected}
                  transparent={state("PRESSURE_SENSOR").transparent}
                  hovered={hovered === "PRESSURE_SENSOR"}
                  metalness={0.5}
                  roughness={0.25}
                  opacityScale={oilDim("PRESSURE_SENSOR")}
                />
              </ClickableMesh>
              {oilInteractive ? (
                <HitProxy
                  name="PRESSURE_SENSOR"
                  radius={hitRadiusFor("PRESSURE_SENSOR", recommended)}
                  onObjectClick={onObjectClick}
                  onHover={setHovered}
                />
              ) : null}
              {state("PRESSURE_SENSOR").selected ||
              hovered === "PRESSURE_SENSOR" ? (
                <HighlightRing radius={0.11} />
              ) : null}
              {hovered === "PRESSURE_SENSOR" ? (
                <Html
                  position={[0, 0.12, 0]}
                  center
                  distanceFactor={6}
                  style={{ pointerEvents: "none" }}
                >
                  <div className="rounded bg-slate-950/85 px-1 py-0.5 text-[7px] text-amber-100 whitespace-nowrap">
                    오일 압력 센서
                  </div>
                </Html>
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
                color="#b45309"
                selected={state("OIL_PIPE_MAIN").selected}
                transparent={state("OIL_PIPE_MAIN").transparent}
                metalness={0.3}
                roughness={0.5}
                opacityScale={oilDim("OIL_PIPE_MAIN")}
              />
            </mesh>
          ) : null}
        </group>
      ) : null}
    </group>
  );
}
