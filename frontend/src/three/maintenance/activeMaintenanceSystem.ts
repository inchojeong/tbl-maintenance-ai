import type {
  ActiveMaintenanceSystem,
  SystemCode,
} from "../../types/diagnosis";

/**
 * Map diagnosis system_code → 3D activeMaintenanceSystem.
 * ELECTRICAL faults use the GENERATOR overlay namespace.
 */
export function toActiveMaintenanceSystem(
  systemCode: string | null | undefined,
): ActiveMaintenanceSystem | null {
  if (systemCode === "ENGINE_OIL") return "ENGINE_OIL";
  if (systemCode === "HYDRAULIC") return "HYDRAULIC";
  if (systemCode === "ELECTRICAL") return "GENERATOR";
  return null;
}

/** Legacy inspectionSystem / selectedSystem token (ELECTRICAL stays ELECTRICAL). */
export function toLegacyInspectionSystem(
  active: ActiveMaintenanceSystem | null,
): string | null {
  if (!active) return null;
  if (active === "GENERATOR") return "ELECTRICAL";
  return active;
}

export function isSystemCode(
  code: string | null | undefined,
): code is SystemCode {
  return Boolean(code);
}

export const GENERATOR_PARTS = [
  "GENERATOR",
  "GENERATOR_CONTROL",
  "GENERATOR_WIRING",
] as const;

export const HYDRAULIC_PARTS = [
  "HYDRAULIC_PUMP",
  "HYDRAULIC_SENSOR",
  "HYDRAULIC_LINE",
] as const;

export const ENGINE_OIL_PARTS = [
  "PRESSURE_SENSOR",
  "OIL_FILTER",
  "OIL_PUMP",
  "OIL_PIPE_MAIN",
  "ENGINE_BLOCK",
] as const;

export function defaultRecommendedPart(
  active: ActiveMaintenanceSystem,
  suspected?: string[] | null,
): string {
  if (active === "ENGINE_OIL") {
    return (
      suspected?.find((c) =>
        ["PRESSURE_SENSOR", "OIL_FILTER", "OIL_PUMP"].includes(c),
      ) ?? "PRESSURE_SENSOR"
    );
  }
  if (active === "HYDRAULIC") {
    return (
      suspected?.find((c) =>
        ["HYDRAULIC_PUMP", "HYDRAULIC_SENSOR", "HYDRAULIC_LINE"].includes(c),
      ) ?? "HYDRAULIC_PUMP"
    );
  }
  return (
    suspected?.find((c) =>
      ["GENERATOR", "GENERATOR_CONTROL", "GENERATOR_WIRING"].includes(c),
    ) ?? "GENERATOR"
  );
}
