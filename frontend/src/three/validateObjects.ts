/**
 * Soft validation helpers for authored maintenance GLBs (optional).
 * Exterior UH-60 models are NOT required to contain these names —
 * maintenance parts live in MaintenanceInternalOverlay.
 */

export const MAINTENANCE_OVERLAY_OBJECT_NAMES = [
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

/** @deprecated Exterior GLBs no longer require these names. */
export const REQUIRED_OBJECT_NAMES = MAINTENANCE_OVERLAY_OBJECT_NAMES;

export function validateObjectNames(found: string[]): {
  ok: boolean;
  missing: string[];
} {
  const set = new Set(found);
  const missing = MAINTENANCE_OVERLAY_OBJECT_NAMES.filter((n) => !set.has(n));
  return { ok: missing.length === 0, missing: [...missing] };
}

/** Dev-only log; never surfaces in the user UI. */
export function warnMissingMaintenanceObjects(found: string[]): void {
  if (!import.meta.env.DEV) return;
  const { ok, missing } = validateObjectNames(found);
  if (!ok) {
    console.warn(
      "[maintenance overlay] optional authored meshes missing:",
      missing.join(", "),
    );
  }
}
