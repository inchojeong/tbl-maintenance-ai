import faultMeshMapData from "../data/faultMeshMap.json";
import maintenanceAreasData from "../data/maintenanceAreas.json";
import type { DiagnosisResult } from "../types/diagnosis";
import type {
  AreaId,
  FaultMeshEntry,
  MaintenanceAreaConfig,
  ResolvedFault,
} from "../types/fault";
import { publicUrl } from "../utils/publicUrl";

const faults = faultMeshMapData.faults as Record<string, FaultMeshEntry>;
const areas = maintenanceAreasData.areas as MaintenanceAreaConfig[];

/** New AREA_01 names → existing Proxy mesh names */
const DEFAULT_LEGACY_MESH_MAP: Record<string, string> = {
  AREA_01_HOTSPOT: "ENGINE_BLOCK",
  AREA_01_COVER_01: "ENGINE_BLOCK",
  AREA_01_COVER_02: "ENGINE_BLOCK",
  AREA_01_PART_01: "OIL_FILTER",
  AREA_01_PART_02: "OIL_PUMP",
  AREA_01_PART_03: "PRESSURE_SENSOR",
  AREA_01_CHECK_01: "PRESSURE_SENSOR",
  HYDRAULIC_ZONE: "HYDRAULIC_PUMP",
  ELECTRICAL_ZONE: "GENERATOR",
};

function buildAliasIndex(): Map<string, string> {
  const map = new Map<string, string>();
  for (const [code, entry] of Object.entries(faults)) {
    map.set(code, code);
    for (const alias of entry.legacy_aliases ?? []) {
      map.set(alias, code);
    }
  }
  return map;
}

const aliasIndex = buildAliasIndex();

export function getFaultEntry(faultCode: string): FaultMeshEntry | null {
  return faults[faultCode] ?? null;
}

export function getAreaConfig(areaId: string): MaintenanceAreaConfig | null {
  return areas.find((a) => a.area_id === areaId) ?? null;
}

export function getEnabledAreas(): MaintenanceAreaConfig[] {
  return areas.filter((a) => a.enabled);
}

export function resolveFaultCode(
  faultCodeOrAlias: string | null | undefined,
): string | null {
  if (!faultCodeOrAlias) return null;
  return aliasIndex.get(faultCodeOrAlias) ?? null;
}

/** Expand mesh IDs so both AREA_* and legacy Proxy names match. */
export function expandMeshIds(
  ids: string[],
  fault?: FaultMeshEntry | null,
): string[] {
  const legacyMap = {
    ...DEFAULT_LEGACY_MESH_MAP,
    ...(fault?.legacy_mesh_map ?? {}),
  };
  const out = new Set<string>();
  for (const id of ids) {
    if (!id) continue;
    out.add(id);
    const legacy = legacyMap[id];
    if (legacy) out.add(legacy);
    // reverse: legacy → new
    for (const [neu, leg] of Object.entries(legacyMap)) {
      if (leg === id) out.add(neu);
    }
  }
  return [...out];
}

export function resolveFault(faultCodeOrAlias: string): ResolvedFault | null {
  const code = resolveFaultCode(faultCodeOrAlias);
  if (!code) return null;
  const fault = getFaultEntry(code);
  if (!fault) return null;
  const area = getAreaConfig(fault.area_id);
  if (!area || !area.enabled) return null;

  const modelUrl = publicUrl(
    area.model.startsWith("/") ? area.model : `models/${fault.model}`,
  );

  return {
    fault,
    area,
    highlightMeshes: expandMeshIds(
      [fault.target_mesh, area.hotspotMesh],
      fault,
    ),
    coverMeshes: expandMeshIds([fault.cover_mesh], fault),
    viewTargetId: fault.default_view_target,
    modelUrl,
  };
}

/**
 * Resolve from diagnosis payload.
 * Priority: fault_code → view_target_id → suspected component → AREA_01 oil demo.
 */
export function resolveFromDiagnosis(
  result: DiagnosisResult | null | undefined,
): ResolvedFault | null {
  if (!result) return null;

  if (result.fault_code) {
    const byFault = resolveFault(result.fault_code);
    if (byFault) return byFault;
  }

  if (result.view_target_id) {
    const byView = resolveFault(result.view_target_id);
    if (byView) return byView;
  }

  for (const c of result.suspected_components ?? []) {
    const byComp = resolveFault(c);
    if (byComp) return byComp;
  }

  if (result.symptom_code) {
    const bySymptom = resolveFault(result.symptom_code);
    if (bySymptom) return bySymptom;
  }

  if (result.system_code === "ENGINE_OIL") {
    return resolveFault("FAULT_AREA01_PART01");
  }
  if (result.system_code === "HYDRAULIC") {
    return resolveFault("FAULT_HYD_SYSTEM");
  }
  if (result.system_code === "ELECTRICAL") {
    return resolveFault("FAULT_ELEC_SYSTEM");
  }
  if (result.system_code === "DRIVE_SYSTEM") {
    return resolveFault("FAULT_XMSN_SYSTEM");
  }
  if (result.system_code === "FUEL") {
    return resolveFault("FAULT_FUEL_SYSTEM");
  }

  return null;
}

export function isArea01(areaId: string | null | undefined): boolean {
  return areaId === "AREA_01";
}

export function listFaultCodes(): string[] {
  return Object.keys(faults);
}

export type { AreaId, FaultMeshEntry, MaintenanceAreaConfig, ResolvedFault };
