import { useMemo } from "react";
import { useAppStore } from "../../stores/useAppStore";
import type { AircraftModelProps } from "../../types/diagnosis";
import {
  SYSTEM_OBJECT_IDS,
  systemForObject,
  type MaintenanceSystemId,
} from "./maintenanceRegistry";
import { EngineOilSystemModel } from "./EngineOilSystemModel";
import { HydraulicSystemModel } from "./HydraulicSystemModel";
import { GeneratorSystemModel } from "./GeneratorSystemModel";

const ENGINE_VIEWS = new Set([
  "ENGINE_OIL_SYSTEM",
  "ENGINE_ACCESS_PANEL",
  "ENGINE_INTERNAL_VIEW",
  "ENGINE_OIL_INTERNAL",
  "ENGINE_OIL_FILTER",
  "ENGINE_OIL_PUMP",
  "ENGINE_PRESSURE_SENSOR",
  "ENGINE_OVERVIEW",
  "AREA_01_OVERVIEW",
  "AREA_01_CLOSE",
  "AREA_01_INTERNAL",
]);

const HYD_VIEWS = new Set([
  "HYDRAULIC_SYSTEM",
  "HYDRAULIC_OVERVIEW",
  "HYDRAULIC_PUMP",
  "HYDRAULIC_SENSOR",
  "HYDRAULIC_LINE",
]);

const ELEC_VIEWS = new Set([
  "ELECTRICAL_SYSTEM",
  "GENERATOR_OVERVIEW",
  "GENERATOR_DETAIL",
  "GENERATOR_WIRING",
]);

function resolveActiveSystems(
  systemCode: string | null | undefined,
  viewTargetId: string,
  highlighted: string[],
): Set<MaintenanceSystemId> {
  const out = new Set<MaintenanceSystemId>();

  if (systemCode === "ENGINE_OIL" || ENGINE_VIEWS.has(viewTargetId)) {
    out.add("ENGINE_OIL");
  }
  if (systemCode === "HYDRAULIC" || HYD_VIEWS.has(viewTargetId)) {
    out.add("HYDRAULIC");
  }
  if (systemCode === "ELECTRICAL" || ELEC_VIEWS.has(viewTargetId)) {
    out.add("ELECTRICAL");
  }

  for (const id of highlighted) {
    const sys = systemForObject(id);
    if (sys) out.add(sys);
    if (id === "HYDRAULIC_ZONE") out.add("HYDRAULIC");
    if (id === "ELECTRICAL_ZONE") out.add("ELECTRICAL");
    if (id === "ENGINE_ZONE" || id.startsWith("AREA_01_")) out.add("ENGINE_OIL");
  }

  return out;
}

/**
 * Internal maintenance overlay rendered with the UH-60 exterior.
 * Hidden in aircraft overview; shown during inspection / diagnosis.
 */
export function MaintenanceInternalOverlay({
  selectedObjectIds,
  hiddenObjectIds,
  transparentObjectIds,
  onObjectClick,
}: AircraftModelProps) {
  const viewTargetId = useAppStore((s) => s.viewTargetId);
  const diagnosisResult = useAppStore((s) => s.diagnosisResult);
  const xrayMode = useAppStore((s) => s.xrayMode);

  const selectedIds = useMemo(
    () => new Set(selectedObjectIds),
    [selectedObjectIds],
  );
  const transparentIds = useMemo(
    () => new Set(transparentObjectIds),
    [transparentObjectIds],
  );

  const inspectionActive =
    viewTargetId !== "AIRCRAFT_OVERVIEW" ||
    xrayMode ||
    selectedObjectIds.length > 0 ||
    Boolean(diagnosisResult);

  const activeSystems = useMemo(
    () =>
      resolveActiveSystems(
        diagnosisResult?.system_code,
        viewTargetId,
        selectedObjectIds,
      ),
    [diagnosisResult?.system_code, viewTargetId, selectedObjectIds],
  );

  const hiddenIds = useMemo(() => {
    const hidden = new Set(hiddenObjectIds);
    if (!inspectionActive) {
      for (const id of Object.values(SYSTEM_OBJECT_IDS).flat()) {
        hidden.add(id);
      }
      return hidden;
    }
    for (const [sys, ids] of Object.entries(SYSTEM_OBJECT_IDS) as [
      MaintenanceSystemId,
      (typeof SYSTEM_OBJECT_IDS)[MaintenanceSystemId],
    ][]) {
      if (!activeSystems.has(sys)) {
        for (const id of ids) hidden.add(id);
      }
    }
    return hidden;
  }, [hiddenObjectIds, inspectionActive, activeSystems]);

  if (!inspectionActive && activeSystems.size === 0) {
    return null;
  }

  const common = {
    selectedIds,
    hiddenIds,
    transparentIds,
    onObjectClick,
  };

  return (
    <group name="MAINTENANCE_INTERNAL_OVERLAY">
      {activeSystems.has("ENGINE_OIL") ? (
        <EngineOilSystemModel {...common} />
      ) : null}
      {activeSystems.has("HYDRAULIC") ? (
        <HydraulicSystemModel {...common} />
      ) : null}
      {activeSystems.has("ELECTRICAL") ? (
        <GeneratorSystemModel {...common} />
      ) : null}
    </group>
  );
}
