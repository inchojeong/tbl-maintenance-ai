import { describe, expect, it } from "vitest";
import {
  activeHitTargetsByLevel,
  nextInspectionLevel,
  previousInspectionLevel,
  resolveEngineOilClick,
  CLICK_TRANSITION_LOCK_MS,
} from "./inspectionClick";

describe("inspectionClick levels", () => {
  it("nextInspectionLevel advances one step", () => {
    expect(nextInspectionLevel("EXTERIOR")).toBe("SYSTEM");
    expect(nextInspectionLevel("SYSTEM")).toBe("ASSEMBLY");
    expect(nextInspectionLevel("ASSEMBLY")).toBe("COMPONENT");
    expect(nextInspectionLevel("COMPONENT")).toBeNull();
  });

  it("previousInspectionLevel retreats one step", () => {
    expect(previousInspectionLevel("COMPONENT")).toBe("ASSEMBLY");
    expect(previousInspectionLevel("ASSEMBLY")).toBe("SYSTEM");
    expect(previousInspectionLevel("SYSTEM")).toBe("EXTERIOR");
    expect(previousInspectionLevel("EXTERIOR")).toBeNull();
  });

  it("active hit targets are level-gated", () => {
    expect(activeHitTargetsByLevel("EXTERIOR").has("ENGINE_ZONE")).toBe(true);
    expect(activeHitTargetsByLevel("EXTERIOR").has("OIL_FILTER")).toBe(false);
    expect(activeHitTargetsByLevel("SYSTEM").has("ENGINE_LEFT")).toBe(true);
    expect(activeHitTargetsByLevel("SYSTEM").has("PRESSURE_SENSOR")).toBe(
      false,
    );
    expect(activeHitTargetsByLevel("ASSEMBLY").has("PRESSURE_SENSOR")).toBe(
      true,
    );
    expect(activeHitTargetsByLevel("ASSEMBLY").has("ENGINE_ZONE")).toBe(false);
  });
});

describe("resolveEngineOilClick one-step", () => {
  it("EXTERIOR zone → SYSTEM only", () => {
    expect(resolveEngineOilClick("EXTERIOR", "ENGINE_ZONE")).toEqual({
      type: "system",
    });
    expect(resolveEngineOilClick("EXTERIOR", "ENGINE_ZONE_HIT_AREA")).toEqual({
      type: "system",
    });
  });

  it("EXTERIOR engine mesh does not skip to ASSEMBLY", () => {
    expect(resolveEngineOilClick("EXTERIOR", "ENGINE_BLOCK")).toEqual({
      type: "system",
    });
    expect(resolveEngineOilClick("EXTERIOR", "ENGINE_LEFT")).toEqual({
      type: "system",
    });
  });

  it("SYSTEM engine → ASSEMBLY only", () => {
    expect(resolveEngineOilClick("SYSTEM", "ENGINE_LEFT_HIT_AREA")).toEqual({
      type: "assembly",
      assembly: "ENGINE_LEFT",
    });
    expect(resolveEngineOilClick("SYSTEM", "ENGINE_BLOCK")).toEqual({
      type: "assembly",
      assembly: "ENGINE_LEFT",
    });
  });

  it("oil parts ignored until ASSEMBLY", () => {
    expect(resolveEngineOilClick("EXTERIOR", "PRESSURE_SENSOR").type).toBe(
      "ignore",
    );
    expect(resolveEngineOilClick("SYSTEM", "OIL_FILTER").type).toBe("ignore");
  });

  it("ASSEMBLY oil → COMPONENT", () => {
    expect(resolveEngineOilClick("ASSEMBLY", "PRESSURE_SENSOR")).toEqual({
      type: "component",
      partId: "PRESSURE_SENSOR",
    });
  });

  it("COMPONENT oil switches selection only", () => {
    expect(resolveEngineOilClick("COMPONENT", "OIL_FILTER")).toEqual({
      type: "component",
      partId: "OIL_FILTER",
    });
  });

  it("transition lock duration is within 400–600ms band", () => {
    expect(CLICK_TRANSITION_LOCK_MS).toBeGreaterThanOrEqual(400);
    expect(CLICK_TRANSITION_LOCK_MS).toBeLessThanOrEqual(600);
  });
});
