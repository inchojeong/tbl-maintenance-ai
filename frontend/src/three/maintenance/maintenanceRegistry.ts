/**
 * Maintenance internal overlay object registry.
 * Internal maintenance components are prototype visualization objects and do not
 * represent an exact UH-60 internal configuration.
 */

import type { ActiveMaintenanceSystem } from "../../types/diagnosis";

export const EXTERIOR_XRAY_TOKEN = "EXTERIOR";

/** Tokens that mean "make the entire exterior GLB translucent". */
export const EXTERIOR_TRANSPARENCY_TOKENS = new Set([
  EXTERIOR_XRAY_TOKEN,
  "AIRCRAFT_BODY",
  "ENGINE_ZONE",
  "COCKPIT",
]);

/** @deprecated Prefer ActiveMaintenanceSystem; ELECTRICAL maps to GENERATOR in 3D. */
export type MaintenanceSystemId = "ENGINE_OIL" | "HYDRAULIC" | "ELECTRICAL";

export const MAINTENANCE_OBJECT_IDS = [
  "ENGINE_BLOCK",
  "OIL_FILTER",
  "OIL_PUMP",
  "PRESSURE_SENSOR",
  "OIL_PIPE_MAIN",
  "HYDRAULIC_PUMP",
  "HYDRAULIC_LINE",
  "HYDRAULIC_SENSOR",
  "GENERATOR",
  "GENERATOR_CONTROL",
  "GENERATOR_WIRING",
] as const;

export type MaintenanceObjectId = (typeof MAINTENANCE_OBJECT_IDS)[number];

export const MAINTENANCE_OBJECTS: Record<
  MaintenanceObjectId,
  {
    labelKo: string;
    system: MaintenanceSystemId;
    activeSystem: ActiveMaintenanceSystem;
    viewTargetId: string;
  }
> = {
  ENGINE_BLOCK: {
    labelKo: "No.1 엔진",
    system: "ENGINE_OIL",
    activeSystem: "ENGINE_OIL",
    viewTargetId: "ENGINE_OIL_SYSTEM",
  },
  OIL_FILTER: {
    labelKo: "엔진 오일 필터",
    system: "ENGINE_OIL",
    activeSystem: "ENGINE_OIL",
    viewTargetId: "ENGINE_OIL_FILTER",
  },
  OIL_PUMP: {
    labelKo: "오일 펌프",
    system: "ENGINE_OIL",
    activeSystem: "ENGINE_OIL",
    viewTargetId: "ENGINE_OIL_PUMP",
  },
  PRESSURE_SENSOR: {
    labelKo: "오일 압력 센서",
    system: "ENGINE_OIL",
    activeSystem: "ENGINE_OIL",
    viewTargetId: "ENGINE_PRESSURE_SENSOR",
  },
  OIL_PIPE_MAIN: {
    labelKo: "메인 오일 배관",
    system: "ENGINE_OIL",
    activeSystem: "ENGINE_OIL",
    viewTargetId: "ENGINE_OIL_INTERNAL",
  },
  HYDRAULIC_PUMP: {
    labelKo: "유압 펌프",
    system: "HYDRAULIC",
    activeSystem: "HYDRAULIC",
    viewTargetId: "HYDRAULIC_PUMP",
  },
  HYDRAULIC_LINE: {
    labelKo: "유압 배관",
    system: "HYDRAULIC",
    activeSystem: "HYDRAULIC",
    viewTargetId: "HYDRAULIC_LINE",
  },
  HYDRAULIC_SENSOR: {
    labelKo: "유압 센서",
    system: "HYDRAULIC",
    activeSystem: "HYDRAULIC",
    viewTargetId: "HYDRAULIC_SENSOR",
  },
  GENERATOR: {
    labelKo: "발전기",
    system: "ELECTRICAL",
    activeSystem: "GENERATOR",
    viewTargetId: "GENERATOR_DETAIL",
  },
  GENERATOR_CONTROL: {
    labelKo: "발전기 제어·커넥터",
    system: "ELECTRICAL",
    activeSystem: "GENERATOR",
    viewTargetId: "GENERATOR_CONTROL",
  },
  GENERATOR_WIRING: {
    labelKo: "전기 배선",
    system: "ELECTRICAL",
    activeSystem: "GENERATOR",
    viewTargetId: "GENERATOR_WIRING",
  },
};

export const SYSTEM_OBJECT_IDS: Record<
  ActiveMaintenanceSystem,
  MaintenanceObjectId[]
> = {
  ENGINE_OIL: [
    "ENGINE_BLOCK",
    "OIL_FILTER",
    "OIL_PUMP",
    "PRESSURE_SENSOR",
    "OIL_PIPE_MAIN",
  ],
  HYDRAULIC: ["HYDRAULIC_PUMP", "HYDRAULIC_LINE", "HYDRAULIC_SENSOR"],
  GENERATOR: ["GENERATOR", "GENERATOR_CONTROL", "GENERATOR_WIRING"],
};

/** Legacy ELECTRICAL key → same as GENERATOR objects */
export const LEGACY_SYSTEM_OBJECT_IDS: Record<
  MaintenanceSystemId,
  MaintenanceObjectId[]
> = {
  ENGINE_OIL: SYSTEM_OBJECT_IDS.ENGINE_OIL,
  HYDRAULIC: SYSTEM_OBJECT_IDS.HYDRAULIC,
  ELECTRICAL: SYSTEM_OBJECT_IDS.GENERATOR,
};

export type SystemRegistryEntry = {
  id: ActiveMaintenanceSystem;
  labelKo: string;
  diagnosisCodes: string[];
  systemViewTarget: string;
  assemblyViewTarget: string;
  components: MaintenanceObjectId[];
  defaultRecommended: MaintenanceObjectId;
};

export const SYSTEM_REGISTRY: Record<
  ActiveMaintenanceSystem,
  SystemRegistryEntry
> = {
  ENGINE_OIL: {
    id: "ENGINE_OIL",
    labelKo: "엔진 오일계통",
    diagnosisCodes: ["ENGINE_OIL"],
    systemViewTarget: "ENGINE_SYSTEM",
    assemblyViewTarget: "ENGINE_LEFT_ASSEMBLY",
    components: SYSTEM_OBJECT_IDS.ENGINE_OIL,
    defaultRecommended: "PRESSURE_SENSOR",
  },
  HYDRAULIC: {
    id: "HYDRAULIC",
    labelKo: "유압계통",
    diagnosisCodes: ["HYDRAULIC"],
    systemViewTarget: "HYDRAULIC_OVERVIEW",
    assemblyViewTarget: "HYDRAULIC_ASSEMBLY",
    components: SYSTEM_OBJECT_IDS.HYDRAULIC,
    defaultRecommended: "HYDRAULIC_PUMP",
  },
  GENERATOR: {
    id: "GENERATOR",
    labelKo: "발전기·전기계통",
    diagnosisCodes: ["ELECTRICAL"],
    systemViewTarget: "GENERATOR_OVERVIEW",
    assemblyViewTarget: "GENERATOR_ASSEMBLY",
    components: SYSTEM_OBJECT_IDS.GENERATOR,
    defaultRecommended: "GENERATOR",
  },
};

/** Visual context only — not maintenance drill-down targets */
export const POWERTRAIN_CONTEXT_OBJECTS = [
  "DRIVE_SHAFT_LEFT",
  "DRIVE_SHAFT_RIGHT",
  "MAIN_GEARBOX",
  "ROTOR_MAST",
] as const;

export function isMaintenanceObjectId(id: string): id is MaintenanceObjectId {
  return id in MAINTENANCE_OBJECTS;
}

export function systemForObject(id: string): MaintenanceSystemId | null {
  if (!isMaintenanceObjectId(id)) return null;
  return MAINTENANCE_OBJECTS[id].system;
}

export function activeSystemForObject(
  id: string,
): ActiveMaintenanceSystem | null {
  if (!isMaintenanceObjectId(id)) return null;
  return MAINTENANCE_OBJECTS[id].activeSystem;
}

/** Raw exterior mesh names (e.g. Object_0) should not drive maintenance UX. */
export function isRawExteriorMeshName(name: string): boolean {
  return /^Object_\d+$/i.test(name) || /^mesh/i.test(name);
}
