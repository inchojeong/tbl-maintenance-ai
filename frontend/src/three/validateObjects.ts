export const REQUIRED_OBJECT_NAMES = [
  "AIRCRAFT_BODY",
  "COCKPIT",
  "ENGINE_ZONE",
  "ENGINE_PANEL_LEFT",
  "ENGINE_PANEL_RIGHT",
  "ENGINE_BLOCK",
  "OIL_FILTER",
  "OIL_PUMP",
  "PRESSURE_SENSOR",
  "OIL_PIPE_MAIN",
  "MAIN_ROTOR",
  "TAIL_ROTOR",
  "LANDING_GEAR_LEFT",
  "LANDING_GEAR_RIGHT",
] as const;

export function validateObjectNames(found: string[]): {
  ok: boolean;
  missing: string[];
} {
  const set = new Set(found);
  const missing = REQUIRED_OBJECT_NAMES.filter((n) => !set.has(n));
  return { ok: missing.length === 0, missing: [...missing] };
}
