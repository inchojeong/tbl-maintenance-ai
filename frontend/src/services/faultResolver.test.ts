import { describe, expect, it } from "vitest";
import {
  expandMeshIds,
  resolveFault,
  resolveFaultCode,
  resolveFromDiagnosis,
} from "./faultResolver";
import type { DiagnosisResult } from "../types/diagnosis";

describe("faultResolver", () => {
  it("resolves FAULT_AREA01_PART01", () => {
    const r = resolveFault("FAULT_AREA01_PART01");
    expect(r).not.toBeNull();
    expect(r!.area.area_id).toBe("AREA_01");
    expect(r!.fault.target_mesh).toBe("AREA_01_PART_01");
    expect(r!.modelUrl).toContain("Maintenance_Area_01");
  });

  it("resolves legacy alias ENGINE_OIL_SYSTEM", () => {
    expect(resolveFaultCode("ENGINE_OIL_SYSTEM")).toBe("FAULT_AREA01_PART01");
    const r = resolveFault("ENGINE_OIL_FILTER");
    expect(r?.fault.fault_code).toBe("FAULT_AREA01_PART01");
  });

  it("expands AREA mesh to legacy proxy names", () => {
    const r = resolveFault("FAULT_AREA01_PART01");
    const ids = expandMeshIds(["AREA_01_PART_01"], r!.fault);
    expect(ids).toContain("AREA_01_PART_01");
    expect(ids).toContain("OIL_FILTER");
  });

  it("resolves from diagnosis fault_code", () => {
    const d: DiagnosisResult = {
      system_code: "ENGINE_OIL",
      symptom_code: "LOW_OIL_PRESSURE",
      risk_level: "HIGH",
      suspected_components: ["OIL_FILTER"],
      answer: "test",
      manual_ids: [],
      recommended_steps: [],
      view_target_id: "ENGINE_OIL_SYSTEM",
      confidence: 0.9,
      is_demo: true,
      fault_code: "FAULT_AREA01_PART01",
    };
    const r = resolveFromDiagnosis(d);
    expect(r?.area.area_id).toBe("AREA_01");
  });

  it("resolves HYD_PRESS_LOW to hydraulic system hotspot", () => {
    expect(resolveFaultCode("HYD_PRESS_LOW")).toBe("FAULT_HYD_SYSTEM");
    const r = resolveFault("HYD_PRESS_LOW");
    expect(r?.fault.target_mesh).toBe("HYDRAULIC_SENSOR");
    expect(r?.viewTargetId).toBe("HYDRAULIC_SYSTEM");
  });

  it("resolves GEN_OFF to electrical hotspot", () => {
    expect(resolveFaultCode("GEN_OFF")).toBe("FAULT_ELEC_SYSTEM");
  });

  it("resolves XMSN_OIL_HOT to drive hotspot", () => {
    expect(resolveFaultCode("XMSN_OIL_HOT")).toBe("FAULT_XMSN_SYSTEM");
  });
});
