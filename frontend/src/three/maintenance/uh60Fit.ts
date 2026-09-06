/**
 * Exterior / inspection visual constants for cutaway UX.
 * Prototype visualization — illustrative opacities and fit.
 */

import type { InspectionLevel } from "../../types/diagnosis";

export const UH60_TARGET_SIZE = 5.8;

export const UH60_FIT = {
  scale: 2.32,
  position: [0, 1.15, 0] as [number, number, number],
  bboxMin: [-2.347, 0.38, -2.9] as [number, number, number],
  bboxMax: [2.347, 1.92, 2.9] as [number, number, number],
  bboxSize: [4.693, 1.541, 5.8] as [number, number, number],
  center: [0, 1.15, 0] as [number, number, number],
  /** Upper cowling deck — engines sit inside this band */
  upperDeckY: 1.48,
  mainRotorHub: [0, 1.78, 0.15] as [number, number, number],
} as const;

/** Ghost shell — stronger hierarchy vs internal metal */
export const EXTERIOR_OPACITY_BY_LEVEL: Record<InspectionLevel, number> = {
  EXTERIOR: 1,
  SYSTEM: 0.16,
  ASSEMBLY: 0.12,
  COMPONENT: 0.08,
};

export const ROTOR_EXTRA_OPACITY_FACTOR: Record<InspectionLevel, number> = {
  EXTERIOR: 1,
  SYSTEM: 0.45,
  ASSEMBLY: 0.55,
  COMPONENT: 0.4,
};

export const EXTERIOR_XRAY_OPACITY = EXTERIOR_OPACITY_BY_LEVEL.SYSTEM;

/**
 * Tuned so nacelles read as installed in the upper bay (not floating pods).
 * Slightly under previous 1.45 which overshot the cowling silhouette.
 */
export const ENGINE_ASSEMBLY_SCALE = 1.18;

/** Internal overlay render above translucent exterior */
export const INTERNAL_RENDER_ORDER = 2;
export const EXTERIOR_RENDER_ORDER = 0;
