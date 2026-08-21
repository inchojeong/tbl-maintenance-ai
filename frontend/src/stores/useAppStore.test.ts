import { describe, expect, it } from "vitest";
import { matchDemoResponse } from "../services/demoService";
import { useAppStore } from "./useAppStore";

describe("demoService", () => {
  it("matches oil pressure demo query with public TM sources", () => {
    const r = matchDemoResponse(
      "1번 엔진 오일 압력 경고가 발생했는데 어디를 확인해야 해?",
    );
    expect(r.system_code).toBe("ENGINE_OIL");
    expect(r.symptom_code).toBe("ENG_OIL_PRESS_LOW");
    expect(r.view_target_id).toBe("ENGINE_PRESSURE_SENSOR");
    expect(r.is_demo).toBe(true);
    expect(r.sources?.[0]?.manual_id).toBe("TM 55-1520-240-T-2");
    expect(r.sources?.[0]?.page ?? r.sources?.[0]?.pdf_page).toBe(114);
    expect(r.sources?.[0]?.task ?? r.sources?.[0]?.paragraph).toBe("8-3.3");
    expect(r.fault_code).toBe("FAULT_AREA01_PART01");
  });

  it("matches hydraulic demo to system hotspot", () => {
    const r = matchDemoResponse("유압 압력이 이상해");
    expect(r.system_code).toBe("HYDRAULIC");
    expect(r.symptom_code).toBe("HYD_PRESS_LOW");
    expect(r.view_target_id).toBe("HYDRAULIC_SYSTEM");
    expect(r.fault_code).toBe("FAULT_HYD_SYSTEM");
  });

  it("matches generator demo", () => {
    const r = matchDemoResponse("발전기 경고가 들어왔어");
    expect(r.system_code).toBe("ELECTRICAL");
    expect(r.fault_code).toBe("FAULT_ELEC_SYSTEM");
  });

  it("falls back for unknown query", () => {
    const r = matchDemoResponse("알 수 없는 증상 xyz");
    expect(r.system_code).toBe("UNKNOWN");
    expect(r.view_target_id).toBe("AIRCRAFT_OVERVIEW");
  });
});

describe("useAppStore applyViewTarget", () => {
  it("applies ENGINE_OIL_SYSTEM highlights with exterior x-ray", () => {
    useAppStore.getState().resetScene();
    useAppStore.getState().applyViewTarget("ENGINE_OIL_SYSTEM");
    const s = useAppStore.getState();
    expect(s.viewTargetId).toBe("ENGINE_OIL_SYSTEM");
    expect(s.highlightedObjects).toContain("PRESSURE_SENSOR");
    expect(s.transparentObjects).toContain("EXTERIOR");
    expect(s.viewLevel).toBe("SYSTEM");
  });

  it("falls back on invalid view target", () => {
    useAppStore.getState().applyViewTarget("NOT_EXISTS");
    expect(useAppStore.getState().viewTargetId).toBe("AIRCRAFT_OVERVIEW");
  });

  it("resets scene", () => {
    useAppStore.getState().applyViewTarget("ENGINE_OIL_FILTER");
    useAppStore.getState().resetScene();
    expect(useAppStore.getState().viewTargetId).toBe("AIRCRAFT_OVERVIEW");
    expect(useAppStore.getState().highlightedObjects).toEqual([]);
  });
});
