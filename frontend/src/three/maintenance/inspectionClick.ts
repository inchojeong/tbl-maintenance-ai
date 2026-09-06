/**
 * Pure one-step drill-down resolution for ENGINE_OIL 3D clicks.
 * One click → exactly one inspection level change.
 */

import type { InspectionAssembly, InspectionLevel } from "../../types/diagnosis";

export type InspectionClickAction =
  | { type: "system" }
  | { type: "assembly"; assembly: InspectionAssembly }
  | { type: "component"; partId: string }
  | { type: "ignore"; reason: string };

const OIL_PARTS = new Set([
  "OIL_FILTER",
  "PRESSURE_SENSOR",
  "OIL_PUMP",
  "OIL_PIPE_MAIN",
]);

const ZONE_IDS = new Set([
  "ENGINE_ZONE",
  "ENGINE_ZONE_MARKER",
  "ENGINE_ZONE_HIT",
  "ENGINE_ZONE_HIT_AREA",
  "AREA_01_HOTSPOT",
]);

const LEFT_ENGINE_IDS = new Set([
  "ENGINE_BLOCK",
  "ENGINE_LEFT",
  "ENGINE_LEFT_HIT",
  "ENGINE_LEFT_HIT_AREA",
]);

const RIGHT_ENGINE_IDS = new Set([
  "ENGINE_RIGHT",
  "ENGINE_RIGHT_HIT",
  "ENGINE_RIGHT_HIT_AREA",
]);

export function normalizeClickId(objectId: string): string {
  if (objectId === "AREA_01_HOTSPOT") return "ENGINE_ZONE";
  if (objectId === "AREA_01_PART_01" || objectId === "AREA_01_CHECK_01") {
    return "OIL_FILTER";
  }
  if (objectId === "AREA_01_PART_02") return "OIL_PUMP";
  if (objectId === "AREA_01_PART_03") return "PRESSURE_SENSOR";
  return objectId;
}

export function nextInspectionLevel(
  level: InspectionLevel,
): InspectionLevel | null {
  if (level === "EXTERIOR") return "SYSTEM";
  if (level === "SYSTEM") return "ASSEMBLY";
  if (level === "ASSEMBLY") return "COMPONENT";
  return null;
}

export function previousInspectionLevel(
  level: InspectionLevel,
): InspectionLevel | null {
  if (level === "COMPONENT") return "ASSEMBLY";
  if (level === "ASSEMBLY") return "SYSTEM";
  if (level === "SYSTEM") return "EXTERIOR";
  return null;
}

/** Which logical targets may receive clicks at this level */
export function activeHitTargetsByLevel(
  level: InspectionLevel,
): Set<string> {
  if (level === "EXTERIOR") {
    return new Set(["ENGINE_ZONE", "ENGINE_ZONE_HIT_AREA", "ENGINE_ZONE_MARKER"]);
  }
  if (level === "SYSTEM") {
    return new Set([
      "ENGINE_BLOCK",
      "ENGINE_LEFT",
      "ENGINE_LEFT_HIT_AREA",
      "ENGINE_RIGHT",
      "ENGINE_RIGHT_HIT_AREA",
    ]);
  }
  if (level === "ASSEMBLY" || level === "COMPONENT") {
    return new Set([
      "OIL_FILTER",
      "PRESSURE_SENSOR",
      "OIL_PUMP",
      "OIL_PIPE_MAIN",
    ]);
  }
  return new Set();
}

/**
 * Resolve a raw 3D/callout click into a single-step action.
 */
export function resolveEngineOilClick(
  level: InspectionLevel,
  rawObjectId: string,
): InspectionClickAction {
  const id = normalizeClickId(rawObjectId);

  if (ZONE_IDS.has(id) || id === "ENGINE_ZONE_HIT_AREA") {
    if (level === "EXTERIOR") return { type: "system" };
    return { type: "ignore", reason: "zone_only_at_exterior" };
  }

  if (LEFT_ENGINE_IDS.has(id)) {
    if (level === "SYSTEM") {
      return { type: "assembly", assembly: "ENGINE_LEFT" };
    }
    if (level === "EXTERIOR") {
      // Never skip SYSTEM — treat as zone entry
      return { type: "system" };
    }
    return { type: "ignore", reason: "engine_not_active_at_level" };
  }

  if (RIGHT_ENGINE_IDS.has(id)) {
    if (level === "SYSTEM") {
      return { type: "assembly", assembly: "ENGINE_RIGHT" };
    }
    return { type: "ignore", reason: "engine_right_only_at_system" };
  }

  if (OIL_PARTS.has(id)) {
    if (level === "ASSEMBLY" || level === "COMPONENT") {
      return { type: "component", partId: id };
    }
    return { type: "ignore", reason: "oil_only_at_assembly_or_component" };
  }

  return { type: "ignore", reason: `unhandled:${id}` };
}

export const CLICK_DRAG_THRESHOLD_PX = 5;
export const CLICK_TRANSITION_LOCK_MS = 550;
