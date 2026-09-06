/**
 * Pure annotation builders per activeMaintenanceSystem — unit-testable.
 */

import type {
  ActiveMaintenanceSystem,
  InspectionLevel,
} from "../../types/diagnosis";
import { labelComponent } from "../../services/displayLabels";
import type { AnnotationSpec } from "../annotationStore";
import {
  ENGINE_LEFT_ANCHOR,
  ENGINE_REL,
  GEARBOX_ANCHOR,
  GENERATOR_ANCHOR,
  GENERATOR_REL,
  HYDRAULIC_ANCHOR,
  HYDRAULIC_REL,
  worldFromGeneratorRel,
  worldFromHydraulicRel,
  worldFromPrimaryRel,
} from "./maintenanceAnchors";

export type AnnotationContext = {
  active: ActiveMaintenanceSystem | null;
  level: InspectionLevel;
  selectedPart: string | null;
  recommendedPart: string | null;
  hoveredPart: string | null;
};

function oilAnnotations(ctx: AnnotationContext): AnnotationSpec[] {
  const { level, selectedPart, recommendedPart, hoveredPart } = ctx;
  if (level === "EXTERIOR") return [];

  if (level === "SYSTEM") {
    return [
      {
        id: "NO1",
        world: ENGINE_LEFT_ANCHOR,
        side: "left",
        title: "No.1 엔진",
        subtitle: "우선 점검 대상",
        accent: true,
        clickId: "ENGINE_BLOCK",
      },
      {
        id: "GBX",
        world: GEARBOX_ANCHOR,
        side: "right",
        title: "메인기어박스",
        subtitle: "동력 전달부",
        accent: false,
        clickId: undefined,
      },
    ];
  }

  if (level === "ASSEMBLY") {
    return [
      {
        id: "SENSOR",
        world: worldFromPrimaryRel(ENGINE_REL.PRESSURE_SENSOR),
        side: "right",
        title: labelComponent("PRESSURE_SENSOR"),
        subtitle:
          recommendedPart === "PRESSURE_SENSOR"
            ? "우선 점검 대상"
            : "점검 가능",
        accent: recommendedPart === "PRESSURE_SENSOR" || !recommendedPart,
        clickId: "PRESSURE_SENSOR",
      },
      {
        id: "FILTER",
        world: worldFromPrimaryRel(ENGINE_REL.OIL_FILTER),
        side: "left",
        title: labelComponent("OIL_FILTER"),
        subtitle: "오염 여부 확인",
        accent: false,
        clickId: "OIL_FILTER",
      },
      {
        id: "PUMP",
        world: worldFromPrimaryRel(ENGINE_REL.OIL_PUMP),
        side: "left",
        title: labelComponent("OIL_PUMP"),
        subtitle: "상태 확인",
        accent: false,
        clickId: "OIL_PUMP",
      },
    ];
  }

  const focus = selectedPart ?? hoveredPart;
  if (!focus) return [];
  const world =
    focus === "OIL_FILTER"
      ? worldFromPrimaryRel(ENGINE_REL.OIL_FILTER)
      : focus === "OIL_PUMP"
        ? worldFromPrimaryRel(ENGINE_REL.OIL_PUMP)
        : focus === "PRESSURE_SENSOR"
          ? worldFromPrimaryRel(ENGINE_REL.PRESSURE_SENSOR)
          : ENGINE_LEFT_ANCHOR;
  const side =
    focus === "OIL_FILTER" || focus === "OIL_PUMP" ? "left" : "right";
  return [
    {
      id: "FOCUS",
      world,
      side,
      title: labelComponent(focus),
      subtitle:
        recommendedPart === focus || focus === selectedPart
          ? "우선 점검 대상"
          : "선택",
      accent: true,
      clickId: focus,
    },
  ];
}

function generatorAnnotations(ctx: AnnotationContext): AnnotationSpec[] {
  const { level, selectedPart, recommendedPart, hoveredPart } = ctx;
  if (level === "EXTERIOR") return [];

  if (level === "SYSTEM") {
    return [
      {
        id: "GEN_SYS",
        world: GENERATOR_ANCHOR,
        side: "left",
        title: "No.1 발전기",
        subtitle: "출력 이상 점검 대상",
        accent: true,
        clickId: "GENERATOR",
      },
    ];
  }

  if (level === "ASSEMBLY") {
    return [
      {
        id: "GEN_BODY",
        world: worldFromGeneratorRel(GENERATOR_REL.BODY),
        side: "left",
        title: labelComponent("GENERATOR"),
        subtitle:
          recommendedPart === "GENERATOR" ? "우선 점검 대상" : "본체",
        accent: recommendedPart === "GENERATOR" || !recommendedPart,
        clickId: "GENERATOR",
      },
      {
        id: "GEN_CTRL",
        world: worldFromGeneratorRel(GENERATOR_REL.CONTROL),
        side: "right",
        title: labelComponent("GENERATOR_CONTROL"),
        subtitle: "커넥터·제어",
        accent: recommendedPart === "GENERATOR_CONTROL",
        clickId: "GENERATOR_CONTROL",
      },
      {
        id: "GEN_WIRE",
        world: worldFromGeneratorRel([0.28, 0.1, -0.14]),
        side: "right",
        title: labelComponent("GENERATOR_WIRING"),
        subtitle: "배선 상태",
        accent: recommendedPart === "GENERATOR_WIRING",
        clickId: "GENERATOR_WIRING",
      },
    ];
  }

  const focus = selectedPart ?? hoveredPart ?? "GENERATOR";
  const world =
    focus === "GENERATOR_CONTROL"
      ? worldFromGeneratorRel(GENERATOR_REL.CONTROL)
      : focus === "GENERATOR_WIRING"
        ? worldFromGeneratorRel([0.28, 0.1, -0.14])
        : worldFromGeneratorRel(GENERATOR_REL.BODY);
  return [
    {
      id: "FOCUS",
      world,
      side: "left",
      title: labelComponent(focus),
      subtitle: "우선 점검 대상",
      accent: true,
      clickId: focus,
    },
  ];
}

function hydraulicAnnotations(ctx: AnnotationContext): AnnotationSpec[] {
  const { level, selectedPart, recommendedPart, hoveredPart } = ctx;
  if (level === "EXTERIOR") return [];

  if (level === "SYSTEM") {
    return [
      {
        id: "HYD_SYS",
        world: HYDRAULIC_ANCHOR,
        side: "right",
        title: "유압계통",
        subtitle: "우선 점검 대상",
        accent: true,
        clickId: "HYDRAULIC_PUMP",
      },
    ];
  }

  if (level === "ASSEMBLY") {
    return [
      {
        id: "HYD_PUMP",
        world: worldFromHydraulicRel(HYDRAULIC_REL.PUMP),
        side: "left",
        title: labelComponent("HYDRAULIC_PUMP"),
        subtitle:
          recommendedPart === "HYDRAULIC_PUMP"
            ? "우선 점검 대상"
            : "펌프",
        accent: recommendedPart === "HYDRAULIC_PUMP" || !recommendedPart,
        clickId: "HYDRAULIC_PUMP",
      },
      {
        id: "HYD_SENSOR",
        world: worldFromHydraulicRel(HYDRAULIC_REL.SENSOR),
        side: "right",
        title: labelComponent("HYDRAULIC_SENSOR"),
        subtitle: "압력 센서",
        accent: recommendedPart === "HYDRAULIC_SENSOR",
        clickId: "HYDRAULIC_SENSOR",
      },
      {
        id: "HYD_LINE",
        world: worldFromHydraulicRel([0.12, 0.08, 0.08]),
        side: "right",
        title: labelComponent("HYDRAULIC_LINE"),
        subtitle: "배관",
        accent: recommendedPart === "HYDRAULIC_LINE",
        clickId: "HYDRAULIC_LINE",
      },
    ];
  }

  const focus = selectedPart ?? hoveredPart ?? "HYDRAULIC_PUMP";
  const world =
    focus === "HYDRAULIC_SENSOR"
      ? worldFromHydraulicRel(HYDRAULIC_REL.SENSOR)
      : focus === "HYDRAULIC_LINE"
        ? worldFromHydraulicRel([0.12, 0.08, 0.08])
        : worldFromHydraulicRel(HYDRAULIC_REL.PUMP);
  return [
    {
      id: "FOCUS",
      world,
      side: "right",
      title: labelComponent(focus),
      subtitle: "우선 점검 대상",
      accent: true,
      clickId: focus,
    },
  ];
}

/**
 * Build callouts strictly for the active maintenance system.
 * Cross-system annotations are never returned.
 */
export function buildAnnotationsForActiveSystem(
  ctx: AnnotationContext,
): AnnotationSpec[] {
  if (!ctx.active) return [];
  if (ctx.active === "ENGINE_OIL") return oilAnnotations(ctx);
  if (ctx.active === "HYDRAULIC") return hydraulicAnnotations(ctx);
  if (ctx.active === "GENERATOR") return generatorAnnotations(ctx);
  return [];
}

/** Test helper: ids present in annotations */
export function annotationIds(ctx: AnnotationContext): string[] {
  return buildAnnotationsForActiveSystem(ctx).map((a) => a.id);
}

export function annotationClickIds(ctx: AnnotationContext): string[] {
  return buildAnnotationsForActiveSystem(ctx)
    .map((a) => a.clickId)
    .filter((x): x is string => Boolean(x));
}
