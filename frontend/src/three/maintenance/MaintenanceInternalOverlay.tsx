import { useMemo } from "react";
import { useAppStore } from "../../stores/useAppStore";
import type { AircraftModelProps } from "../../types/diagnosis";
import { SYSTEM_OBJECT_IDS } from "./maintenanceRegistry";
import { EngineOilSystemModel } from "./EngineOilSystemModel";
import { HydraulicSystemModel } from "./HydraulicSystemModel";
import { GeneratorSystemModel } from "./GeneratorSystemModel";
import { EngineZoneMarker } from "./EngineZoneMarker";

/**
 * Mounts ONLY the activeMaintenanceSystem overlay — never cross-system geometry.
 */
export function MaintenanceInternalOverlay({
  selectedObjectIds,
  hiddenObjectIds,
  transparentObjectIds,
  onObjectClick,
}: AircraftModelProps) {
  const active = useAppStore((s) => s.activeMaintenanceSystem);
  const inspectionLevel = useAppStore((s) => s.inspectionLevel);
  const selectedPart = useAppStore((s) => s.selectedMaintenancePart);

  const selectedIds = useMemo(
    () => new Set(selectedObjectIds),
    [selectedObjectIds],
  );
  const transparentIds = useMemo(
    () => new Set(transparentObjectIds),
    [transparentObjectIds],
  );

  const hiddenIds = useMemo(() => {
    const hidden = new Set(hiddenObjectIds);
    // Hide all other systems' object ids so shared pick lists stay clean
    for (const [sys, ids] of Object.entries(SYSTEM_OBJECT_IDS)) {
      if (sys !== active) {
        for (const id of ids) hidden.add(id);
      }
    }
    if (inspectionLevel === "EXTERIOR" && active !== "ENGINE_OIL") {
      if (active) {
        for (const id of SYSTEM_OBJECT_IDS[active]) hidden.add(id);
      }
    }
    return hidden;
  }, [hiddenObjectIds, active, inspectionLevel]);

  if (!active) return null;

  // ENGINE_OIL EXTERIOR: zone marker only (no internal oil mesh yet)
  if (active === "ENGINE_OIL" && inspectionLevel === "EXTERIOR") {
    return (
      <group name="MAINTENANCE_INTERNAL_OVERLAY">
        <EngineZoneMarker />
      </group>
    );
  }

  if (inspectionLevel === "EXTERIOR") return null;

  const common = {
    selectedIds,
    hiddenIds,
    transparentIds,
    onObjectClick,
    dimNonSelected: inspectionLevel === "COMPONENT" && Boolean(selectedPart),
  };

  return (
    <group name="MAINTENANCE_INTERNAL_OVERLAY">
      {active === "ENGINE_OIL" ? (
        <>
          <EngineZoneMarker />
          <EngineOilSystemModel {...common} />
        </>
      ) : null}
      {active === "HYDRAULIC" ? <HydraulicSystemModel {...common} /> : null}
      {active === "GENERATOR" ? <GeneratorSystemModel {...common} /> : null}
    </group>
  );
}
