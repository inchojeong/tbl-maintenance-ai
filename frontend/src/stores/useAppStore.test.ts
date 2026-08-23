import { describe, expect, it, beforeEach } from "vitest";
import { matchDemoResponse } from "../services/demoService";
import { useAppStore } from "./useAppStore";
import {
  annotationClickIds,
  buildAnnotationsForActiveSystem,
} from "../three/maintenance/maintenanceAnnotations";
import { toActiveMaintenanceSystem } from "../three/maintenance/activeMaintenanceSystem";

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

  it("matches generator demo to GENERATOR_OVERVIEW", () => {
    const r = matchDemoResponse("발전기 출력이 22.4V로 떨어졌습니다");
    expect(r.system_code).toBe("ELECTRICAL");
    expect(r.view_target_id).toBe("GENERATOR_OVERVIEW");
    expect(toActiveMaintenanceSystem(r.system_code)).toBe("GENERATOR");
  });

  it("falls back for unknown query", () => {
    const r = matchDemoResponse("알 수 없는 증상 xyz");
    expect(r.system_code).toBe("UNKNOWN");
    expect(r.view_target_id).toBe("AIRCRAFT_OVERVIEW");
  });
});

describe("maintenance annotations by active system", () => {
  it("ENGINE_OIL ASSEMBLY → oil parts only", () => {
    const clicks = annotationClickIds({
      active: "ENGINE_OIL",
      level: "ASSEMBLY",
      selectedPart: null,
      recommendedPart: "PRESSURE_SENSOR",
      hoveredPart: null,
    });
    expect(clicks).toEqual(
      expect.arrayContaining(["PRESSURE_SENSOR", "OIL_FILTER", "OIL_PUMP"]),
    );
    expect(clicks).not.toContain("GENERATOR");
  });

  it("GENERATOR SYSTEM → generator only, no oil", () => {
    const clicks = annotationClickIds({
      active: "GENERATOR",
      level: "SYSTEM",
      selectedPart: null,
      recommendedPart: "GENERATOR",
      hoveredPart: null,
    });
    expect(clicks).toEqual(["GENERATOR"]);
    expect(clicks).not.toContain("PRESSURE_SENSOR");
    expect(clicks).not.toContain("OIL_FILTER");
  });

  it("GENERATOR ASSEMBLY → generator parts only", () => {
    const clicks = annotationClickIds({
      active: "GENERATOR",
      level: "ASSEMBLY",
      selectedPart: null,
      recommendedPart: "GENERATOR",
      hoveredPart: null,
    });
    expect(clicks).toEqual(
      expect.arrayContaining([
        "GENERATOR",
        "GENERATOR_CONTROL",
        "GENERATOR_WIRING",
      ]),
    );
    expect(clicks.some((c) => c.startsWith("OIL") || c === "PRESSURE_SENSOR")).toBe(
      false,
    );
  });

  it("HYDRAULIC ASSEMBLY → hydraulic only", () => {
    const clicks = annotationClickIds({
      active: "HYDRAULIC",
      level: "ASSEMBLY",
      selectedPart: null,
      recommendedPart: "HYDRAULIC_PUMP",
      hoveredPart: null,
    });
    expect(clicks).toEqual(
      expect.arrayContaining([
        "HYDRAULIC_PUMP",
        "HYDRAULIC_SENSOR",
        "HYDRAULIC_LINE",
      ]),
    );
    expect(clicks).not.toContain("GENERATOR");
    expect(clicks).not.toContain("PRESSURE_SENSOR");
  });

  it("null active → empty annotations", () => {
    expect(
      buildAnnotationsForActiveSystem({
        active: null,
        level: "ASSEMBLY",
        selectedPart: "PRESSURE_SENSOR",
        recommendedPart: "PRESSURE_SENSOR",
        hoveredPart: null,
      }),
    ).toEqual([]);
  });
});

describe("useAppStore applyViewTarget", () => {
  beforeEach(() => {
    useAppStore.getState().resetScene();
  });

  it("applies ENGINE_OIL_SYSTEM highlights with exterior x-ray", () => {
    useAppStore.getState().applyViewTarget("ENGINE_OIL_SYSTEM");
    const s = useAppStore.getState();
    expect(s.viewTargetId).toBe("ENGINE_OIL_SYSTEM");
    expect(s.highlightedObjects).toContain("ENGINE_BLOCK");
    expect(s.transparentObjects).toContain("EXTERIOR");
    expect(s.viewLevel).toBe("SYSTEM");
    expect(s.inspectionLevel).toBe("SYSTEM");
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
    expect(useAppStore.getState().inspectionLevel).toBe("EXTERIOR");
    expect(useAppStore.getState().activeMaintenanceSystem).toBeNull();
  });

  it("beginEngineOilInspection stays at EXTERIOR without full x-ray", () => {
    useAppStore.setState({
      diagnosisResult: {
        system_code: "ENGINE_OIL",
        symptom_code: "ENG_OIL_PRESS_LOW",
        risk_level: "MEDIUM",
        suspected_components: ["PRESSURE_SENSOR"],
        answer: "test",
        manual_ids: [],
        recommended_steps: [],
        view_target_id: "ENGINE_PRESSURE_SENSOR",
        confidence: 0.9,
        is_demo: true,
      },
    });
    useAppStore.getState().beginEngineOilInspection("PRESSURE_SENSOR");
    const s = useAppStore.getState();
    expect(s.inspectionLevel).toBe("EXTERIOR");
    expect(s.activeMaintenanceSystem).toBe("ENGINE_OIL");
    expect(s.viewTargetId).toBe("ENGINE_ZONE_GUIDE");
    expect(s.transparentObjects).not.toContain("EXTERIOR");
    expect(s.recommendedMaintenancePart).toBe("PRESSURE_SENSOR");
  });

  it("drill-down SYSTEM → ASSEMBLY → COMPONENT", () => {
    useAppStore.setState({
      diagnosisResult: {
        system_code: "ENGINE_OIL",
        symptom_code: "ENG_OIL_PRESS_LOW",
        risk_level: "MEDIUM",
        suspected_components: ["PRESSURE_SENSOR"],
        answer: "test",
        manual_ids: [],
        recommended_steps: [],
        view_target_id: "ENGINE_ZONE_GUIDE",
        confidence: 0.9,
        is_demo: true,
      },
      activeMaintenanceSystem: "ENGINE_OIL",
    });
    useAppStore.getState().beginEngineOilInspection();
    useAppStore.getState().enterInspectionSystem();
    expect(useAppStore.getState().inspectionLevel).toBe("SYSTEM");
    useAppStore.getState().enterInspectionAssembly("ENGINE_LEFT");
    expect(useAppStore.getState().inspectionLevel).toBe("ASSEMBLY");
    useAppStore.getState().enterInspectionComponent("PRESSURE_SENSOR");
    expect(useAppStore.getState().inspectionLevel).toBe("COMPONENT");
    expect(useAppStore.getState().selectedMaintenancePart).toBe(
      "PRESSURE_SENSOR",
    );
  });

  it("diagnosis change oil→generator resets selection and recommended", async () => {
    useAppStore.setState({ isDemoMode: true });
    await useAppStore
      .getState()
      .submitQuery("엔진오일 압력이 31 PSI로 떨어졌습니다");
    useAppStore.getState().enterInspectionAssembly("ENGINE_LEFT");
    useAppStore.getState().enterInspectionComponent("PRESSURE_SENSOR");
    expect(useAppStore.getState().selectedMaintenancePart).toBe(
      "PRESSURE_SENSOR",
    );
    expect(useAppStore.getState().activeMaintenanceSystem).toBe("ENGINE_OIL");

    await useAppStore
      .getState()
      .submitQuery("발전기 출력이 22.4V로 떨어졌습니다");
    const s = useAppStore.getState();
    expect(s.activeMaintenanceSystem).toBe("GENERATOR");
    expect(s.selectedMaintenancePart).toBeNull();
    expect(s.selectedAssembly).toBeNull();
    expect(s.recommendedMaintenancePart).toBe("GENERATOR");
    expect(s.inspectionLevel).toBe("SYSTEM");
    expect(s.viewTargetId).toBe("GENERATOR_OVERVIEW");
    expect(s.diagnosisResult?.system_code).toBe("ELECTRICAL");
  });

  it("diagnosis change generator→hydraulic resets generator state", async () => {
    useAppStore.setState({ isDemoMode: true });
    await useAppStore
      .getState()
      .submitQuery("발전기 출력이 22.4V로 떨어졌습니다");
    useAppStore.getState().enterInspectionAssembly("GENERATOR_ASSEMBLY");
    useAppStore.getState().enterInspectionComponent("GENERATOR");
    expect(useAppStore.getState().selectedMaintenancePart).toBe("GENERATOR");

    await useAppStore.getState().submitQuery("유압 압력이 낮습니다");
    const s = useAppStore.getState();
    expect(s.activeMaintenanceSystem).toBe("HYDRAULIC");
    expect(s.selectedMaintenancePart).toBeNull();
    expect(s.recommendedMaintenancePart).toBe("HYDRAULIC_SENSOR");
    expect(s.inspectionLevel).toBe("SYSTEM");
  });

  it("diagnosis change hydraulic→oil resets hydraulic state", async () => {
    useAppStore.setState({ isDemoMode: true });
    await useAppStore.getState().submitQuery("유압 압력이 낮습니다");
    useAppStore.getState().enterInspectionAssembly("HYDRAULIC_ASSEMBLY");
    useAppStore.getState().enterInspectionComponent("HYDRAULIC_PUMP");
    expect(useAppStore.getState().selectedMaintenancePart).toBe(
      "HYDRAULIC_PUMP",
    );

    await useAppStore
      .getState()
      .submitQuery("엔진오일 압력이 31 PSI로 떨어졌습니다");
    const s = useAppStore.getState();
    expect(s.activeMaintenanceSystem).toBe("ENGINE_OIL");
    expect(s.selectedMaintenancePart).toBeNull();
    expect(s.recommendedMaintenancePart).toBe("PRESSURE_SENSOR");
    expect(s.inspectionLevel).toBe("EXTERIOR");
  });
});
