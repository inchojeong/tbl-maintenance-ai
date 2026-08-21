/**
 * Maintenance internal overlay object registry.
 * Internal maintenance components are prototype visualization objects and do not
 * represent an exact UH-60 internal configuration.
 */

export const EXTERIOR_XRAY_TOKEN = "EXTERIOR";

/** Tokens that mean "make the entire exterior GLB translucent". */
export const EXTERIOR_TRANSPARENCY_TOKENS = new Set([
  EXTERIOR_XRAY_TOKEN,
  "AIRCRAFT_BODY",
  "ENGINE_ZONE",
  "COCKPIT",
]);

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
  "GENERATOR_WIRING",
] as const;

export type MaintenanceObjectId = (typeof MAINTENANCE_OBJECT_IDS)[number];

export const MAINTENANCE_OBJECTS: Record<
  MaintenanceObjectId,
  {
    labelKo: string;
    system: MaintenanceSystemId;
    viewTargetId: string;
  }
> = {
  ENGINE_BLOCK: {
    labelKo: "엔진 블록",
    system: "ENGINE_OIL",
    viewTargetId: "ENGINE_OIL_SYSTEM",
  },
  OIL_FILTER: {
    labelKo: "엔진 오일 필터",
    system: "ENGINE_OIL",
    viewTargetId: "ENGINE_OIL_FILTER",
  },
  OIL_PUMP: {
    labelKo: "오일 펌프",
    system: "ENGINE_OIL",
    viewTargetId: "ENGINE_OIL_PUMP",
  },
  PRESSURE_SENSOR: {
    labelKo: "오일 압력 센서",
    system: "ENGINE_OIL",
    viewTargetId: "ENGINE_PRESSURE_SENSOR",
  },
  OIL_PIPE_MAIN: {
    labelKo: "메인 오일 배관",
    system: "ENGINE_OIL",
    viewTargetId: "ENGINE_OIL_INTERNAL",
  },
  HYDRAULIC_PUMP: {
    labelKo: "유압 펌프",
    system: "HYDRAULIC",
    viewTargetId: "HYDRAULIC_PUMP",
  },
  HYDRAULIC_LINE: {
    labelKo: "유압 배관",
    system: "HYDRAULIC",
    viewTargetId: "HYDRAULIC_LINE",
  },
  HYDRAULIC_SENSOR: {
    labelKo: "유압 센서",
    system: "HYDRAULIC",
    viewTargetId: "HYDRAULIC_SENSOR",
  },
  GENERATOR: {
    labelKo: "발전기",
    system: "ELECTRICAL",
    viewTargetId: "GENERATOR_DETAIL",
  },
  GENERATOR_WIRING: {
    labelKo: "전기 배선",
    system: "ELECTRICAL",
    viewTargetId: "GENERATOR_WIRING",
  },
};

export const SYSTEM_OBJECT_IDS: Record<MaintenanceSystemId, MaintenanceObjectId[]> =
  {
    ENGINE_OIL: [
      "ENGINE_BLOCK",
      "OIL_FILTER",
      "OIL_PUMP",
      "PRESSURE_SENSOR",
      "OIL_PIPE_MAIN",
    ],
    HYDRAULIC: ["HYDRAULIC_PUMP", "HYDRAULIC_LINE", "HYDRAULIC_SENSOR"],
    ELECTRICAL: ["GENERATOR", "GENERATOR_WIRING"],
  };

export function isMaintenanceObjectId(id: string): id is MaintenanceObjectId {
  return id in MAINTENANCE_OBJECTS;
}

export function systemForObject(id: string): MaintenanceSystemId | null {
  if (!isMaintenanceObjectId(id)) return null;
  return MAINTENANCE_OBJECTS[id].system;
}

/** Raw exterior mesh names (e.g. Object_0) should not drive maintenance UX. */
export function isRawExteriorMeshName(name: string): boolean {
  return /^Object_\d+$/i.test(name) || /^mesh/i.test(name);
}
