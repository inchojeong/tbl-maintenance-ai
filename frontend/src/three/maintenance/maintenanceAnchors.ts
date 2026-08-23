/**
 * Engine bay anchors — retuned for cutaway “installed in cowling” look.
 * Prototype visualization — illustrative UH-60/T700 placement.
 */

import { UH60_FIT, ENGINE_ASSEMBLY_SCALE } from "./uh60Fit";

export type Vec3 = [number, number, number];

const hub = UH60_FIT.mainRotorHub;

/**
 * Twin engines slightly forward of transmission, low enough to sit in upper deck,
 * closer to centerline so they read as bay-mounted (not outboard pods).
 */
export const ENGINE_LEFT_ANCHOR: Vec3 = [-0.3, UH60_FIT.upperDeckY, hub[2] + 0.18];
export const ENGINE_RIGHT_ANCHOR: Vec3 = [0.3, UH60_FIT.upperDeckY, hub[2] + 0.18];

/** Mild nose-up + inboard yaw so exhaust aims at central gearbox */
export const ENGINE_LEFT_ROTATION: Vec3 = [0.06, 0.14, 0.02];
export const ENGINE_RIGHT_ROTATION: Vec3 = [0.06, -0.14, -0.02];

export const ENGINE_PRIMARY_ANCHOR = ENGINE_LEFT_ANCHOR;
export const ENGINE_PRIMARY_ROTATION = ENGINE_LEFT_ROTATION;

export const GEARBOX_ANCHOR: Vec3 = [0, UH60_FIT.upperDeckY + 0.04, hub[2]];
export const MAST_TOP: Vec3 = [hub[0], hub[1] + 0.08, hub[2]];

export const HYDRAULIC_ANCHOR: Vec3 = [0.12, 1.12, 0.05];
export const GENERATOR_ANCHOR: Vec3 = [-0.38, 1.55, hub[2] + 0.38];

/**
 * Oil parts attached to nacelle (local): outboard/lower/housing side for left engine.
 * −X = outboard on No.1 (left).
 */
export const ENGINE_REL = {
  length: 0.52,
  diameter: 0.22,
  OIL_FILTER: [-0.11, -0.085, 0.04] as Vec3,
  OIL_PUMP: [0.04, -0.11, -0.04] as Vec3,
  PRESSURE_SENSOR: [-0.12, -0.02, 0.13] as Vec3,
  OIL_PIPE: [
    [0.02, -0.1, -0.03],
    [-0.04, -0.1, 0.0],
    [-0.09, -0.09, 0.04],
    [-0.11, -0.05, 0.09],
    [-0.12, -0.02, 0.12],
  ] as Vec3[],
} as const;

/** Generator assembly local offsets (relative to GENERATOR_ANCHOR). */
export const GENERATOR_REL = {
  BODY: [0, 0, 0] as Vec3,
  CONTROL: [0.14, -0.02, 0.02] as Vec3,
  WIRING: [
    [0.1, 0.0, 0.0],
    [0.18, 0.04, -0.06],
    [0.28, 0.1, -0.14],
    [0.38, 0.16, -0.22],
    [0.48, 0.22, -0.28],
  ] as Vec3[],
} as const;

/** Hydraulic assembly local offsets (relative to HYDRAULIC_ANCHOR). */
export const HYDRAULIC_REL = {
  PUMP: [0, 0, 0] as Vec3,
  SENSOR: [0.22, 0.14, 0.12] as Vec3,
  LINE: [
    [0.02, 0.02, 0.0],
    [0.08, 0.05, 0.06],
    [0.14, 0.1, 0.1],
    [0.2, 0.13, 0.12],
  ] as Vec3[],
} as const;

export function addVec(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function worldFromAnchorRel(anchor: Vec3, rel: Vec3): Vec3 {
  return addVec(anchor, rel);
}

export function worldFromGeneratorRel(rel: Vec3): Vec3 {
  return worldFromAnchorRel(GENERATOR_ANCHOR, rel);
}

export function worldFromHydraulicRel(rel: Vec3): Vec3 {
  return worldFromAnchorRel(HYDRAULIC_ANCHOR, rel);
}

/** Apply assembly scale + approximate yaw (inboard) for world tip positions. */
export function worldFromPrimaryRel(rel: Vec3): Vec3 {
  const s = ENGINE_ASSEMBLY_SCALE;
  const yaw = ENGINE_PRIMARY_ROTATION[1];
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const lx = rel[0] * s;
  const ly = rel[1] * s;
  const lz = rel[2] * s;
  // Yaw around Y
  const rx = lx * cos + lz * sin;
  const rz = -lx * sin + lz * cos;
  return [
    ENGINE_PRIMARY_ANCHOR[0] + rx,
    ENGINE_PRIMARY_ANCHOR[1] + ly,
    ENGINE_PRIMARY_ANCHOR[2] + rz,
  ];
}

export const ENGINE_CAMERAS = {
  zoneGuide: {
    cameraPosition: [4.8, 2.6, 4.2] as Vec3,
    cameraTarget: [0.0, 1.45, 0.2] as Vec3,
  },
  /** 3/4 side cutaway — engines readable inside ghost fuselage */
  system: {
    cameraPosition: [3.6, 1.75, 0.85] as Vec3,
    cameraTarget: [0.0, 1.48, 0.22] as Vec3,
  },
  leftAssembly: {
    cameraPosition: [1.15, 1.62, 0.55] as Vec3,
    cameraTarget: [
      ENGINE_LEFT_ANCHOR[0],
      ENGINE_LEFT_ANCHOR[1] + 0.02,
      ENGINE_LEFT_ANCHOR[2],
    ] as Vec3,
  },
  sensor: {
    cameraPosition: [0.55, 1.58, 0.72] as Vec3,
    cameraTarget: worldFromPrimaryRel(ENGINE_REL.PRESSURE_SENSOR),
  },
  filter: {
    cameraPosition: [0.45, 1.48, 0.65] as Vec3,
    cameraTarget: worldFromPrimaryRel(ENGINE_REL.OIL_FILTER),
  },
  pump: {
    cameraPosition: [0.7, 1.42, 0.55] as Vec3,
    cameraTarget: worldFromPrimaryRel(ENGINE_REL.OIL_PUMP),
  },
} as const;

export const GENERATOR_CAMERAS = {
  /** Wide SYSTEM — aircraft fills frame; generator location readable */
  system: {
    cameraPosition: [5.4, 2.9, 5.8] as Vec3,
    cameraTarget: [0.0, 1.35, 0.15] as Vec3,
  },
  assembly: {
    cameraPosition: [1.65, 1.85, 2.15] as Vec3,
    cameraTarget: [
      GENERATOR_ANCHOR[0],
      GENERATOR_ANCHOR[1],
      GENERATOR_ANCHOR[2],
    ] as Vec3,
  },
  body: {
    cameraPosition: [0.95, 1.72, 1.35] as Vec3,
    cameraTarget: worldFromGeneratorRel(GENERATOR_REL.BODY),
  },
  control: {
    cameraPosition: [1.05, 1.7, 1.45] as Vec3,
    cameraTarget: worldFromGeneratorRel(GENERATOR_REL.CONTROL),
  },
  wiring: {
    cameraPosition: [1.25, 1.82, 1.55] as Vec3,
    cameraTarget: worldFromGeneratorRel([0.28, 0.1, -0.14]),
  },
} as const;

export const HYDRAULIC_CAMERAS = {
  system: {
    cameraPosition: [5.2, 2.7, 5.6] as Vec3,
    cameraTarget: [0.05, 1.25, 0.05] as Vec3,
  },
  assembly: {
    cameraPosition: [1.9, 1.55, 2.3] as Vec3,
    cameraTarget: [
      HYDRAULIC_ANCHOR[0],
      HYDRAULIC_ANCHOR[1],
      HYDRAULIC_ANCHOR[2],
    ] as Vec3,
  },
  pump: {
    cameraPosition: [1.05, 1.35, 1.4] as Vec3,
    cameraTarget: worldFromHydraulicRel(HYDRAULIC_REL.PUMP),
  },
  sensor: {
    cameraPosition: [1.15, 1.45, 1.5] as Vec3,
    cameraTarget: worldFromHydraulicRel(HYDRAULIC_REL.SENSOR),
  },
  line: {
    cameraPosition: [1.2, 1.4, 1.55] as Vec3,
    cameraTarget: worldFromHydraulicRel([0.12, 0.08, 0.08]),
  },
} as const;

export const MAINTENANCE_ANCHORS = {
  ENGINE_LEFT: ENGINE_LEFT_ANCHOR,
  ENGINE_RIGHT: ENGINE_RIGHT_ANCHOR,
  ENGINE_PRIMARY: ENGINE_PRIMARY_ANCHOR,
  GEARBOX: GEARBOX_ANCHOR,
  HYDRAULIC: HYDRAULIC_ANCHOR,
  GENERATOR: GENERATOR_ANCHOR,
} as const;

export const COMPONENT_VIEW_TARGET: Record<string, string> = {
  PRESSURE_SENSOR: "ENGINE_PRESSURE_SENSOR",
  OIL_FILTER: "ENGINE_OIL_FILTER",
  OIL_PUMP: "ENGINE_OIL_PUMP",
  OIL_PIPE_MAIN: "ENGINE_OIL_INTERNAL",
  ENGINE_BLOCK: "ENGINE_LEFT_ASSEMBLY",
  GENERATOR: "GENERATOR_DETAIL",
  GENERATOR_CONTROL: "GENERATOR_CONTROL",
  GENERATOR_WIRING: "GENERATOR_WIRING",
  HYDRAULIC_PUMP: "HYDRAULIC_PUMP",
  HYDRAULIC_SENSOR: "HYDRAULIC_SENSOR",
  HYDRAULIC_LINE: "HYDRAULIC_LINE",
};
