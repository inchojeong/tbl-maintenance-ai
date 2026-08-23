import { create } from "zustand";
import type {
  BottomTab,
  ChatMessage,
  DiagnosisResult,
  FailureCase,
  GuideStep,
  InspectionAssembly,
  InspectionLevel,
  ManualChunk,
  ViewLevel,
  ViewTargetConfig,
} from "../types/diagnosis";
import type { AreaId, AreaLoadStatus, ResolvedFault } from "../types/fault";
import viewTargetsData from "../data/viewTargets.json";
import componentMap from "../data/componentMap.json";
import {
  postQuery,
  fetchManuals,
  fetchFailures,
  postDemoReset,
} from "../services/queryService";
import { matchDemoResponse } from "../services/demoService";
import publicManualChunks from "../data/publicManualChunks.json";
import {
  fetchSimilarMaintenance,
  similarQueryFromDiagnosis,
  buildHistoryInsight,
  fetchAircraft,
  searchSimilarLocal,
  listHistoryLocal,
} from "../services/maintenanceHistoryService";
import type {
  AircraftInfo,
  SimilarMaintenanceItem,
} from "../types/maintenance";
import {
  expandMeshIds,
  resolveFromDiagnosis,
  resolveFault,
} from "../services/faultResolver";
import { inspectionStateFromViewTarget } from "../three/maintenance/inspectionState";
import { COMPONENT_VIEW_TARGET } from "../three/maintenance/maintenanceAnchors";
import { SYSTEM_REGISTRY } from "../three/maintenance/maintenanceRegistry";
import {
  defaultRecommendedPart,
  toActiveMaintenanceSystem,
  toLegacyInspectionSystem,
} from "../three/maintenance/activeMaintenanceSystem";
import type { ActiveMaintenanceSystem } from "../types/diagnosis";
import { useAnnotationStore } from "../three/annotationStore";

function failuresFromSimilar(
  similar: SimilarMaintenanceItem[],
): FailureCase[] {
  return similar.map((s) => ({
    id: s.record.maintenance_id,
    symptom: s.record.symptom,
    cause: s.record.root_cause,
    actions: s.record.maintenance_action,
    result: s.record.maintenance_result,
    similarity: s.similarity,
    is_dummy: s.record.is_dummy ?? true,
  }));
}

function manualsFromDiagnosis(
  result: DiagnosisResult | null | undefined,
): ManualChunk[] {
  const ids = new Set(result?.manual_ids ?? []);
  const chunks = (publicManualChunks as { chunks: ManualChunk[] }).chunks ?? [];
  const matched = chunks.filter(
    (c) => ids.has(c.id) || ids.has((c as { document_id?: string }).document_id ?? ""),
  );
  if (matched.length) return matched;
  if (result?.system_code) {
    return chunks.filter((c) => c.system_code === result.system_code).slice(0, 3);
  }
  return chunks.slice(0, 2);
}
const targets = viewTargetsData.targets as unknown as Record<
  string,
  ViewTargetConfig
>;
const FALLBACK_ID = "AIRCRAFT_OVERVIEW";

export const GUIDE_STEPS: GuideStep[] = [
  {
    n: 1,
    title: "엔진 위치 확인",
    detail: "항공기에서 엔진 오일계통 위치를 확인합니다.",
    viewTargetId: "ENGINE_SYSTEM",
  },
  {
    n: 2,
    title: "좌측 엔진 확인",
    detail: "정비 대상 엔진 Assembly를 확인합니다.",
    viewTargetId: "ENGINE_LEFT_ASSEMBLY",
  },
  {
    n: 3,
    title: "오일 압력 센서 확인",
    detail: "오일 압력 센서 상태를 확인합니다.",
    viewTargetId: "ENGINE_PRESSURE_SENSOR",
  },
  {
    n: 4,
    title: "오일 필터 점검",
    detail: "오일 필터 외관 및 차압을 확인합니다.",
    viewTargetId: "ENGINE_OIL_FILTER",
  },
];

export const GUIDE_STEPS_HYDRAULIC: GuideStep[] = [
  {
    n: 1,
    title: "유압 계통 확인",
    detail: "유압계통 전체 위치를 확인합니다.",
    viewTargetId: "HYDRAULIC_OVERVIEW",
  },
  {
    n: 2,
    title: "유압 펌프 점검",
    detail: "유압 펌프 상태를 확인합니다.",
    viewTargetId: "HYDRAULIC_PUMP",
  },
  {
    n: 3,
    title: "유압 배관 확인",
    detail: "유압 배관 누유·손상 여부를 확인합니다.",
    viewTargetId: "HYDRAULIC_LINE",
  },
  {
    n: 4,
    title: "유압 센서 확인",
    detail: "유압 압력 센서 신호를 확인합니다.",
    viewTargetId: "HYDRAULIC_SENSOR",
  },
];

export const GUIDE_STEPS_ELECTRICAL: GuideStep[] = [
  {
    n: 1,
    title: "발전기 위치 확인",
    detail: "발전기 장착 위치를 확인합니다.",
    viewTargetId: "GENERATOR_OVERVIEW",
  },
  {
    n: 2,
    title: "발전기 점검",
    detail: "발전기 Assembly 외관 및 커넥터 상태를 확인합니다.",
    viewTargetId: "GENERATOR_ASSEMBLY",
  },
  {
    n: 3,
    title: "전기 배선 확인",
    detail: "관련 전기 배선·커넥터를 확인합니다.",
    viewTargetId: "GENERATOR_WIRING",
  },
];

export function guideStepsForSystem(systemCode?: string | null): GuideStep[] {
  if (systemCode === "HYDRAULIC") return GUIDE_STEPS_HYDRAULIC;
  if (systemCode === "ELECTRICAL") return GUIDE_STEPS_ELECTRICAL;
  if (systemCode === "ENGINE_OIL") return GUIDE_STEPS;
  return GUIDE_STEPS;
}

function nowTime() {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface AppState {
  aircraftId: string;
  aircraftInfo: AircraftInfo | null;
  viewLevel: ViewLevel;
  selectedSystem: string | null;
  selectedComponent: string | null;
  viewTargetId: string;
  highlightedObjects: string[];
  hiddenObjects: string[];
  transparentObjects: string[];
  openedPanels: string[];
  xrayMode: boolean;
  /** Digital-twin drill-down: EXTERIOR → SYSTEM → ASSEMBLY → COMPONENT */
  inspectionLevel: InspectionLevel;
  /** Explicit 3D system — ENGINE_OIL | HYDRAULIC | GENERATOR */
  activeMaintenanceSystem: ActiveMaintenanceSystem | null;
  /** Legacy alias (ELECTRICAL for GENERATOR) */
  inspectionSystem: string | null;
  selectedAssembly: InspectionAssembly;
  selectedMaintenancePart: string | null;
  recommendedMaintenancePart: string | null;
  hoveredMaintenancePart: string | null;
  guideStep: number;
  diagnosisResult: DiagnosisResult | null;
  messages: ChatMessage[];
  manuals: ManualChunk[];
  failures: FailureCase[];
  similarHistory: SimilarMaintenanceItem[];
  historyInsight: string | null;
  historyRegisterPending: boolean;
  isLoading: boolean;
  error: string | null;
  isDemoMode: boolean;
  activeBottomTab: BottomTab;
  modelWarning: string | null;
  cameraAnimating: boolean;
  activeAreaId: AreaId | null;
  activeFault: ResolvedFault | null;
  areaLoadStatus: AreaLoadStatus;
  areaLoadProgress: number;
  areaForceProxy: boolean;

  setDiagnosisResult: (r: DiagnosisResult | null) => void;
  setAircraftId: (id: string) => void;
  applyViewTarget: (id: string) => void;
  selectObject: (objectId: string) => void;
  openPanel: (panelId?: string) => void;
  setGuideStep: (step: number) => void;
  setActiveBottomTab: (tab: BottomTab) => void;
  setSimilarHistory: (items: SimilarMaintenanceItem[]) => void;
  openHistoryRegister: () => void;
  clearHistoryRegisterPending: () => void;
  resetScene: () => void;
  setDemoMode: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setCameraAnimating: (v: boolean) => void;
  setModelWarning: (w: string | null) => void;
  setAreaLoadStatus: (s: AreaLoadStatus) => void;
  setAreaLoadProgress: (n: number) => void;
  setAreaForceProxy: (v: boolean) => void;
  ensureAreaLoaded: (areaId: AreaId) => void;
  applyResolvedFault: (resolved: ResolvedFault, viewOverride?: string) => void;
  beginEngineOilInspection: (recommendedPart?: string) => void;
  beginHydraulicInspection: (recommendedPart?: string) => void;
  beginGeneratorInspection: (recommendedPart?: string) => void;
  enterInspectionSystem: () => void;
  enterInspectionAssembly: (assembly?: InspectionAssembly) => void;
  enterInspectionComponent: (partId: string) => void;
  goInspectionLevel: (level: InspectionLevel) => void;
  setHoveredMaintenancePart: (id: string | null) => void;
  submitQuery: (text: string) => Promise<void>;
  loadRelatedData: () => Promise<void>;
  refreshAircraft: () => Promise<void>;
  fullReset: () => Promise<void>;
}

const EMPTY_INSPECTION = {
  inspectionLevel: "EXTERIOR" as InspectionLevel,
  activeMaintenanceSystem: null as ActiveMaintenanceSystem | null,
  inspectionSystem: null as string | null,
  selectedAssembly: null as InspectionAssembly,
  selectedMaintenancePart: null as string | null,
  recommendedMaintenancePart: null as string | null,
  hoveredMaintenancePart: null as string | null,
};

function clearAnnotationBridge() {
  useAnnotationStore.getState().setSpecs([]);
  useAnnotationStore.getState().setScreens({});
}

function buildTargetFields(
  id: string,
  fault: ResolvedFault | null,
): Pick<
  AppState,
  | "viewTargetId"
  | "viewLevel"
  | "highlightedObjects"
  | "hiddenObjects"
  | "transparentObjects"
  | "openedPanels"
  | "xrayMode"
  | "selectedSystem"
  | "selectedComponent"
> {
  const cfg = targets[id] ?? targets[FALLBACK_ID];
  const resolvedId = targets[id] ? id : FALLBACK_ID;
  const rawHighlight = [...cfg.highlightObjects];
  const rawHide = [...cfg.hideObjects];
  const rawTransparent = [...cfg.transparentObjects];
  const rawOpen = [...cfg.openPanels];
  const entry = fault?.fault ?? null;

  // EXTERIOR token → also mark legacy proxy shell parts for fallback path
  if (
    rawTransparent.includes("EXTERIOR") ||
    rawTransparent.includes("AIRCRAFT_BODY")
  ) {
    for (const t of ["EXTERIOR", "AIRCRAFT_BODY", "COCKPIT", "ENGINE_ZONE"]) {
      if (!rawTransparent.includes(t)) rawTransparent.push(t);
    }
  }

  return {
    viewTargetId: resolvedId,
    viewLevel: cfg.level as ViewLevel,
    highlightedObjects: expandMeshIds(rawHighlight, entry),
    hiddenObjects: expandMeshIds(rawHide, entry),
    transparentObjects: expandMeshIds(rawTransparent, entry),
    openedPanels: expandMeshIds(rawOpen, entry),
    xrayMode: cfg.transparentObjects.length > 0,
    selectedSystem:
      cfg.level !== "AIRCRAFT"
        ? (fault?.fault.system_code ??
          (rawHighlight.some((h) => h.startsWith("HYDRAULIC"))
            ? "HYDRAULIC"
            : rawHighlight.some((h) => h.startsWith("GENERATOR") || h === "ELECTRICAL_ZONE")
              ? "ELECTRICAL"
              : "ENGINE_OIL"))
        : null,
    selectedComponent:
      expandMeshIds(rawHighlight, entry).find((o) =>
        [
          "OIL_FILTER",
          "AREA_01_PART_01",
          "OIL_PUMP",
          "PRESSURE_SENSOR",
          "HYDRAULIC_PUMP",
          "HYDRAULIC_SENSOR",
          "HYDRAULIC_LINE",
          "GENERATOR",
          "GENERATOR_WIRING",
          "ENGINE_BLOCK",
        ].includes(o),
      ) ?? null,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  aircraftId: "AC-001",
  aircraftInfo: null,
  viewLevel: "AIRCRAFT",
  selectedSystem: null,
  selectedComponent: null,
  viewTargetId: FALLBACK_ID,
  highlightedObjects: [],
  hiddenObjects: [],
  transparentObjects: [],
  openedPanels: [],
  xrayMode: false,
  ...EMPTY_INSPECTION,
  guideStep: 0,
  diagnosisResult: null,
  messages: [
    {
      id: "sys-1",
      role: "system",
      text: "고장 증상이나 계기값을 입력하십시오. 예: 「엔진오일 압력이 31 PSI로 떨어졌습니다」",
      time: nowTime(),
    },
  ],
  manuals: [],
  failures: [],
  similarHistory: [],
  historyInsight: null,
  historyRegisterPending: false,
  isLoading: false,
  error: null,
  isDemoMode: true,
  activeBottomTab: "guide",
  modelWarning: null,
  cameraAnimating: false,
  activeAreaId: null,
  activeFault: null,
  areaLoadStatus: "idle",
  areaLoadProgress: 0,
  areaForceProxy: false,

  setDiagnosisResult: (r) => set({ diagnosisResult: r }),
  setAircraftId: (id) => {
    set({ aircraftId: id });
    void get().refreshAircraft();
  },
  refreshAircraft: async () => {
    const info = await fetchAircraft(get().aircraftId);
    set({ aircraftInfo: info });
  },
  setLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e }),
  setDemoMode: (v) => set({ isDemoMode: v }),
  setActiveBottomTab: (tab) => set({ activeBottomTab: tab }),
  setSimilarHistory: (items) =>
    set({
      similarHistory: items,
      failures: failuresFromSimilar(items),
      historyInsight: buildHistoryInsight(items, get().diagnosisResult),
    }),
  openHistoryRegister: () =>
    set({ activeBottomTab: "history", historyRegisterPending: true }),
  clearHistoryRegisterPending: () => set({ historyRegisterPending: false }),
  setCameraAnimating: (v) => set({ cameraAnimating: v }),
  setModelWarning: (w) => set({ modelWarning: w }),
  setAreaLoadStatus: (s) => set({ areaLoadStatus: s }),
  setAreaLoadProgress: (n) => set({ areaLoadProgress: n }),
  setAreaForceProxy: (v) => set({ areaForceProxy: v }),

  ensureAreaLoaded: (areaId) => {
    if (get().activeAreaId === areaId) return;
    set({
      activeAreaId: areaId,
      areaLoadStatus: "loading",
      areaLoadProgress: 0,
      areaForceProxy: false,
    });
  },

  applyResolvedFault: (resolved, viewOverride) => {
    get().ensureAreaLoaded(resolved.area.area_id);
    set({ activeFault: resolved });
    get().applyViewTarget(viewOverride ?? resolved.viewTargetId);
  },

  beginEngineOilInspection: (recommendedPart = "PRESSURE_SENSOR") => {
    clearAnnotationBridge();
    get().ensureAreaLoaded("AREA_01");
    const fault =
      get().activeFault ??
      resolveFromDiagnosis(get().diagnosisResult) ??
      resolveFault("ENGINE_PRESSURE_SENSOR");
    if (fault) set({ activeFault: fault });
    set({
      error: null,
      activeMaintenanceSystem: "ENGINE_OIL",
      inspectionSystem: "ENGINE_OIL",
      recommendedMaintenancePart: recommendedPart,
      selectedAssembly: null,
      selectedMaintenancePart: null,
      hoveredMaintenancePart: null,
      inspectionLevel: "EXTERIOR",
      guideStep: 1,
      ...buildTargetFields("ENGINE_ZONE_GUIDE", fault),
    });
  },

  beginHydraulicInspection: (recommendedPart = "HYDRAULIC_PUMP") => {
    clearAnnotationBridge();
    set({
      error: null,
      activeMaintenanceSystem: "HYDRAULIC",
      inspectionSystem: "HYDRAULIC",
      recommendedMaintenancePart: recommendedPart,
      selectedAssembly: null,
      selectedMaintenancePart: null,
      hoveredMaintenancePart: null,
      inspectionLevel: "SYSTEM",
      guideStep: 1,
    });
    get().applyViewTarget(SYSTEM_REGISTRY.HYDRAULIC.systemViewTarget);
  },

  beginGeneratorInspection: (recommendedPart = "GENERATOR") => {
    clearAnnotationBridge();
    set({
      error: null,
      activeMaintenanceSystem: "GENERATOR",
      inspectionSystem: "ELECTRICAL",
      recommendedMaintenancePart: recommendedPart,
      selectedAssembly: null,
      selectedMaintenancePart: null,
      hoveredMaintenancePart: null,
      inspectionLevel: "SYSTEM",
      guideStep: 1,
    });
    get().applyViewTarget(SYSTEM_REGISTRY.GENERATOR.systemViewTarget);
  },

  enterInspectionSystem: () => {
    const active = get().activeMaintenanceSystem;
    if (active === "GENERATOR") {
      get().applyViewTarget(SYSTEM_REGISTRY.GENERATOR.systemViewTarget);
      set({
        inspectionLevel: "SYSTEM",
        selectedAssembly: null,
        selectedMaintenancePart: null,
        activeMaintenanceSystem: "GENERATOR",
        inspectionSystem: "ELECTRICAL",
      });
      return;
    }
    if (active === "HYDRAULIC") {
      get().applyViewTarget(SYSTEM_REGISTRY.HYDRAULIC.systemViewTarget);
      set({
        inspectionLevel: "SYSTEM",
        selectedAssembly: null,
        selectedMaintenancePart: null,
        activeMaintenanceSystem: "HYDRAULIC",
        inspectionSystem: "HYDRAULIC",
      });
      return;
    }
    if (active && active !== "ENGINE_OIL") return;
    get().ensureAreaLoaded("AREA_01");
    set({
      inspectionLevel: "SYSTEM",
      activeMaintenanceSystem: "ENGINE_OIL",
      inspectionSystem: "ENGINE_OIL",
      selectedAssembly: null,
      selectedMaintenancePart: null,
    });
    get().applyViewTarget("ENGINE_SYSTEM");
  },

  enterInspectionAssembly: (assembly = "ENGINE_LEFT") => {
    const active = get().activeMaintenanceSystem;
    if (active === "GENERATOR" || assembly === "GENERATOR_ASSEMBLY") {
      get().applyViewTarget(SYSTEM_REGISTRY.GENERATOR.assemblyViewTarget);
      set({
        inspectionLevel: "ASSEMBLY",
        selectedAssembly: "GENERATOR_ASSEMBLY",
        selectedMaintenancePart: null,
        activeMaintenanceSystem: "GENERATOR",
        inspectionSystem: "ELECTRICAL",
      });
      return;
    }
    if (active === "HYDRAULIC" || assembly === "HYDRAULIC_ASSEMBLY") {
      get().applyViewTarget(SYSTEM_REGISTRY.HYDRAULIC.assemblyViewTarget);
      set({
        inspectionLevel: "ASSEMBLY",
        selectedAssembly: "HYDRAULIC_ASSEMBLY",
        selectedMaintenancePart: null,
        activeMaintenanceSystem: "HYDRAULIC",
        inspectionSystem: "HYDRAULIC",
      });
      return;
    }
    if (active && active !== "ENGINE_OIL") return;
    get().ensureAreaLoaded("AREA_01");
    get().applyViewTarget(
      assembly === "ENGINE_RIGHT" ? "ENGINE_SYSTEM" : "ENGINE_LEFT_ASSEMBLY",
    );
    set({
      inspectionLevel: "ASSEMBLY",
      selectedAssembly: assembly === "ENGINE_RIGHT" ? "ENGINE_RIGHT" : "ENGINE_LEFT",
      selectedMaintenancePart: null,
      activeMaintenanceSystem: "ENGINE_OIL",
      inspectionSystem: "ENGINE_OIL",
    });
  },

  enterInspectionComponent: (partId) => {
    const active = get().activeMaintenanceSystem;
    const viewId = COMPONENT_VIEW_TARGET[partId];
    if (!viewId) return;

    if (
      ["GENERATOR", "GENERATOR_CONTROL", "GENERATOR_WIRING"].includes(partId)
    ) {
      if (active && active !== "GENERATOR") return;
      get().applyViewTarget(viewId);
      set({
        inspectionLevel: "COMPONENT",
        selectedAssembly: "GENERATOR_ASSEMBLY",
        selectedMaintenancePart: partId,
        activeMaintenanceSystem: "GENERATOR",
        inspectionSystem: "ELECTRICAL",
        highlightedObjects: [partId],
      });
      return;
    }

    if (
      ["HYDRAULIC_PUMP", "HYDRAULIC_SENSOR", "HYDRAULIC_LINE"].includes(partId)
    ) {
      if (active && active !== "HYDRAULIC") return;
      get().applyViewTarget(viewId);
      set({
        inspectionLevel: "COMPONENT",
        selectedAssembly: "HYDRAULIC_ASSEMBLY",
        selectedMaintenancePart: partId,
        activeMaintenanceSystem: "HYDRAULIC",
        inspectionSystem: "HYDRAULIC",
        highlightedObjects: [partId],
      });
      return;
    }

    if (active && active !== "ENGINE_OIL") return;
    get().ensureAreaLoaded("AREA_01");
    get().applyViewTarget(viewId);
    set({
      inspectionLevel: "COMPONENT",
      selectedAssembly: get().selectedAssembly ?? "ENGINE_LEFT",
      selectedMaintenancePart: partId,
      activeMaintenanceSystem: "ENGINE_OIL",
      inspectionSystem: "ENGINE_OIL",
      highlightedObjects: [partId],
    });
  },

  goInspectionLevel: (level) => {
    const active = get().activeMaintenanceSystem;
    if (level === "EXTERIOR") {
      if (active === "ENGINE_OIL") {
        get().beginEngineOilInspection(
          get().recommendedMaintenancePart ?? "PRESSURE_SENSOR",
        );
      } else if (active === "GENERATOR") {
        get().beginGeneratorInspection(
          get().recommendedMaintenancePart ?? "GENERATOR",
        );
      } else if (active === "HYDRAULIC") {
        get().beginHydraulicInspection(
          get().recommendedMaintenancePart ?? "HYDRAULIC_PUMP",
        );
      } else {
        get().resetScene();
      }
      return;
    }
    if (level === "SYSTEM") {
      get().enterInspectionSystem();
      return;
    }
    if (level === "ASSEMBLY") {
      if (active === "GENERATOR") {
        get().enterInspectionAssembly("GENERATOR_ASSEMBLY");
      } else if (active === "HYDRAULIC") {
        get().enterInspectionAssembly("HYDRAULIC_ASSEMBLY");
      } else {
        get().enterInspectionAssembly(get().selectedAssembly ?? "ENGINE_LEFT");
      }
      return;
    }
    const part =
      get().selectedMaintenancePart ?? get().recommendedMaintenancePart;
    if (part) get().enterInspectionComponent(part);
  },

  setHoveredMaintenancePart: (id) => set({ hoveredMaintenancePart: id }),

  applyViewTarget: (id) => {
    let fault = get().activeFault;
    if (!fault) {
      fault =
        resolveFault(id) ?? resolveFromDiagnosis(get().diagnosisResult);
      if (fault) {
        get().ensureAreaLoaded(fault.area.area_id);
        set({ activeFault: fault });
      }
    }

    if (!targets[id]) {
      set({
        error: `알 수 없는 시점(${id})이라 전체 보기로 이동합니다.`,
        ...buildTargetFields(FALLBACK_ID, fault),
        ...EMPTY_INSPECTION,
      });
      return;
    }

    const current = get().viewTargetId;
    const next = buildTargetFields(id, fault);
    const insp = inspectionStateFromViewTarget(id);
    if (
      current === next.viewTargetId &&
      JSON.stringify(next.highlightedObjects) ===
        JSON.stringify(get().highlightedObjects) &&
      JSON.stringify(next.hiddenObjects) === JSON.stringify(get().hiddenObjects) &&
      get().inspectionLevel === insp.inspectionLevel &&
      get().selectedMaintenancePart === insp.selectedMaintenancePart
    ) {
      return;
    }
    set({
      error: null,
      ...next,
      inspectionLevel: insp.inspectionLevel,
      selectedAssembly: insp.selectedAssembly,
      selectedMaintenancePart: insp.selectedMaintenancePart,
      activeMaintenanceSystem: (() => {
        const fromDiag = toActiveMaintenanceSystem(
          get().diagnosisResult?.system_code,
        );
        if (fromDiag) return fromDiag;
        if (get().activeMaintenanceSystem) return get().activeMaintenanceSystem;
        if (id.includes("GENERATOR") || id.includes("ELECTRICAL")) {
          return "GENERATOR";
        }
        if (id.includes("HYDRAULIC")) return "HYDRAULIC";
        if (
          id.includes("ENGINE") ||
          id.includes("OIL") ||
          id === "AREA_01_OVERVIEW"
        ) {
          return "ENGINE_OIL";
        }
        return null;
      })(),
      inspectionSystem: (() => {
        const active =
          toActiveMaintenanceSystem(get().diagnosisResult?.system_code) ??
          get().activeMaintenanceSystem;
        if (active) return toLegacyInspectionSystem(active);
        return next.selectedSystem ?? get().inspectionSystem;
      })(),
      recommendedMaintenancePart: get().recommendedMaintenancePart,
    });
  },

  selectObject: (objectId) => {
    const legacy =
      objectId === "AREA_01_HOTSPOT"
        ? "ENGINE_ZONE"
        : objectId === "AREA_01_COVER_01"
          ? "ENGINE_PANEL_LEFT"
          : objectId === "AREA_01_COVER_02"
            ? "ENGINE_PANEL_RIGHT"
            : objectId === "AREA_01_PART_01" || objectId === "AREA_01_CHECK_01"
              ? "OIL_FILTER"
              : objectId === "AREA_01_PART_02"
                ? "OIL_PUMP"
                : objectId === "AREA_01_PART_03"
                  ? "PRESSURE_SENSOR"
                  : objectId === "HYDRAULIC_ZONE"
                    ? "HYDRAULIC_PUMP"
                    : objectId === "ELECTRICAL_ZONE"
                      ? "GENERATOR"
                      : objectId;

    const level = get().inspectionLevel;

    if (
      legacy === "ENGINE_ZONE" ||
      objectId === "ENGINE_ZONE_MARKER" ||
      objectId === "AREA_01_HOTSPOT"
    ) {
      get().enterInspectionSystem();
      return;
    }

    if (
      legacy === "ENGINE_BLOCK" ||
      objectId === "ENGINE_LEFT" ||
      objectId === "ENGINE_LEFT_HIT"
    ) {
      if (level === "EXTERIOR" || level === "SYSTEM") {
        get().enterInspectionAssembly("ENGINE_LEFT");
        return;
      }
      if (level === "ASSEMBLY" || level === "COMPONENT") {
        get().enterInspectionAssembly("ENGINE_LEFT");
        return;
      }
    }

    if (objectId === "ENGINE_RIGHT" || objectId === "ENGINE_RIGHT_HIT") {
      get().enterInspectionAssembly("ENGINE_RIGHT");
      return;
    }

    const oilParts = [
      "OIL_FILTER",
      "PRESSURE_SENSOR",
      "OIL_PUMP",
      "OIL_PIPE_MAIN",
    ];
    if (oilParts.includes(legacy)) {
      if (get().activeMaintenanceSystem !== "ENGINE_OIL") return;
      if (level === "EXTERIOR" || level === "SYSTEM") {
        set({
          selectedAssembly: "ENGINE_LEFT",
          activeMaintenanceSystem: "ENGINE_OIL",
          inspectionSystem: "ENGINE_OIL",
        });
      }
      get().enterInspectionComponent(legacy);
      return;
    }

    const genParts = ["GENERATOR", "GENERATOR_CONTROL", "GENERATOR_WIRING"];
    if (genParts.includes(legacy) || legacy === "ELECTRICAL_ZONE") {
      if (
        get().activeMaintenanceSystem &&
        get().activeMaintenanceSystem !== "GENERATOR"
      ) {
        return;
      }
      set({
        activeMaintenanceSystem: "GENERATOR",
        inspectionSystem: "ELECTRICAL",
      });
      if (level === "SYSTEM" || level === "EXTERIOR") {
        get().enterInspectionAssembly("GENERATOR_ASSEMBLY");
        return;
      }
      get().enterInspectionComponent(
        legacy === "ELECTRICAL_ZONE" ? "GENERATOR" : legacy,
      );
      return;
    }

    const hydParts = ["HYDRAULIC_PUMP", "HYDRAULIC_SENSOR", "HYDRAULIC_LINE"];
    if (hydParts.includes(legacy) || legacy === "HYDRAULIC_ZONE") {
      if (
        get().activeMaintenanceSystem &&
        get().activeMaintenanceSystem !== "HYDRAULIC"
      ) {
        return;
      }
      set({
        activeMaintenanceSystem: "HYDRAULIC",
        inspectionSystem: "HYDRAULIC",
      });
      if (level === "SYSTEM" || level === "EXTERIOR") {
        get().enterInspectionAssembly("HYDRAULIC_ASSEMBLY");
        return;
      }
      get().enterInspectionComponent(
        legacy === "HYDRAULIC_ZONE" ? "HYDRAULIC_PUMP" : legacy,
      );
      return;
    }

    const entry = (
      componentMap.objects as Record<
        string,
        { clickable?: boolean; viewTargetId?: string | null }
      >
    )[legacy];
    if (!entry?.clickable && !objectId.startsWith("AREA_01_")) return;
    if (entry?.viewTargetId) get().applyViewTarget(entry.viewTargetId);
  },

  openPanel: (panelId = "ENGINE_PANEL_LEFT") => {
    get().ensureAreaLoaded("AREA_01");
    const fault = get().activeFault;
    const expanded = expandMeshIds([panelId], fault?.fault ?? null);
    set({
      openedPanels: Array.from(new Set([...get().openedPanels, ...expanded])),
      hiddenObjects: Array.from(new Set([...get().hiddenObjects, ...expanded])),
      transparentObjects: Array.from(
        new Set([...get().transparentObjects, "EXTERIOR", "AIRCRAFT_BODY"]),
      ),
      xrayMode: true,
    });
    get().enterInspectionAssembly("ENGINE_LEFT");
  },

  setGuideStep: (step) => {
    const system = get().diagnosisResult?.system_code;
    const steps = guideStepsForSystem(system);
    const s = steps.find((g) => g.n === step);
    set({ guideStep: step, activeBottomTab: "guide" });
    if (s) {
      if (step >= 1) get().ensureAreaLoaded("AREA_01");
      get().applyViewTarget(s.viewTargetId);
    }
  },

  resetScene: () => {
    set({
      ...buildTargetFields(FALLBACK_ID, null),
      ...EMPTY_INSPECTION,
      guideStep: 0,
      error: null,
      activeAreaId: null,
      activeFault: null,
      areaLoadStatus: "idle",
      areaLoadProgress: 0,
      areaForceProxy: false,
    });
  },

  loadRelatedData: async () => {
    const { aircraftId, diagnosisResult, isDemoMode } = get();
    const localManuals = manualsFromDiagnosis(diagnosisResult);

    // Always load similar maintenance history (local JSON works offline)
    let similar: SimilarMaintenanceItem[] = [];
    let insight: string | null = null;
    if (diagnosisResult) {
      const q = similarQueryFromDiagnosis(diagnosisResult, aircraftId);
      try {
        // Demo / Pages: never wait on backend — local JSON is the source of truth
        if (isDemoMode) {
          similar = searchSimilarLocal(q, q.top_k ?? 7);
        } else {
          similar = await fetchSimilarMaintenance(q);
        }
        insight = buildHistoryInsight(similar, diagnosisResult);
        if (similar.length === 0 && get().similarHistory.length > 0) {
          // Keep sync results from submitQuery if re-search somehow empty
          similar = get().similarHistory;
          insight = get().historyInsight;
        }
        if (import.meta.env.DEV) {
          const seedN = listHistoryLocal({}).length;
          // eslint-disable-next-line no-console
          console.info(
            `[MaintenanceHistory] loaded records: ${seedN}`,
            `\n[SimilarCases] query symptom_code: ${q.symptom_code}`,
            `\n[SimilarCases] returned: ${similar.length}`,
          );
        }
      } catch {
        similar = searchSimilarLocal(q, q.top_k ?? 7);
        insight = buildHistoryInsight(similar, diagnosisResult);
      }
    }

    const failureCases = failuresFromSimilar(similar);

    if (isDemoMode) {
      set({
        manuals: localManuals,
        failures: failureCases,
        similarHistory: similar,
        historyInsight: insight,
      });
      void get().refreshAircraft();
      return;
    }
    try {
      const [manuals, _legacyFailures] = await Promise.all([
        fetchManuals(diagnosisResult?.system_code ?? "ENGINE_OIL"),
        fetchFailures(diagnosisResult?.symptom_code).catch(() => []),
      ]);
      set({
        manuals: manuals.length ? manuals : localManuals,
        // Prefer maintenance-history similar cases over legacy /api/failures
        failures: failureCases.length ? failureCases : _legacyFailures,
        similarHistory: similar,
        historyInsight: insight,
      });
    } catch {
      set({
        manuals: localManuals,
        failures: failureCases,
        similarHistory: similar,
        historyInsight: insight,
      });
    }
    void get().refreshAircraft();
  },

  submitQuery: async (text) => {
    const q = text.trim();
    if (!q) {
      set({ error: "증상을 입력해 주세요." });
      return;
    }
    set({
      isLoading: true,
      error: null,
      messages: [
        ...get().messages,
        { id: `u-${Date.now()}`, role: "user", text: q, time: nowTime() },
      ],
    });

    try {
      let result: DiagnosisResult;
      if (get().isDemoMode) {
        result = matchDemoResponse(q);
      } else {
        try {
          result = await postQuery({
            aircraft_id: get().aircraftId,
            query: q,
            demo_mode: false,
          });
        } catch {
          result = { ...matchDemoResponse(q), is_demo: true };
          set({
            error: "서버 연결에 실패하여 데모 고정 응답으로 전환했습니다.",
            isDemoMode: true,
          });
        }
      }

      // Sync similar search BEFORE any async side-effects (3D / API).
      // Demo/Pages must never depend on backend for this tab.
      const similarQ = similarQueryFromDiagnosis(result, get().aircraftId);
      const similar = searchSimilarLocal(similarQ, similarQ.top_k ?? 7);
      const insight = buildHistoryInsight(similar, result);
      const failureCases = failuresFromSimilar(similar);

      const resolved = resolveFromDiagnosis(result);
      set({
        diagnosisResult: result,
        isLoading: false,
        messages: [
          ...get().messages,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: result.answer,
            time: nowTime(),
          },
        ],
        activeBottomTab: "guide",
        guideStep: 1,
        similarHistory: similar,
        historyInsight: insight,
        failures: failureCases,
      });

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.info(
          `[SimilarCases] symptom=${result.symptom_code} matched=${similar.length}`,
          similar.slice(0, 5).map((s) => s.record.maintenance_id),
        );
      }

      if (resolved) {
        get().ensureAreaLoaded(resolved.area.area_id);
        set({ activeFault: resolved });
      }

      const active = toActiveMaintenanceSystem(result.system_code);
      const recommended = active
        ? defaultRecommendedPart(active, result.suspected_components)
        : null;

      // Hard reset prior scenario 3D selection before applying the new system
      clearAnnotationBridge();
      set({
        ...EMPTY_INSPECTION,
        activeMaintenanceSystem: active,
        inspectionSystem: toLegacyInspectionSystem(active),
        recommendedMaintenancePart: recommended,
        inspectionLevel: active === "ENGINE_OIL" ? "EXTERIOR" : "SYSTEM",
      });

      if (active === "ENGINE_OIL") {
        get().beginEngineOilInspection(recommended ?? "PRESSURE_SENSOR");
      } else if (active === "HYDRAULIC") {
        get().beginHydraulicInspection(recommended ?? "HYDRAULIC_PUMP");
      } else if (active === "GENERATOR") {
        get().beginGeneratorInspection(recommended ?? "GENERATOR");
      } else if (resolved) {
        get().applyResolvedFault(resolved, result.view_target_id);
      } else {
        get().applyViewTarget(result.view_target_id);
      }
      // manuals / similar history (already set above)
      void get().loadRelatedData();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[submitQuery] failed", err);
      set({
        isLoading: false,
        error: "질의 처리 중 오류가 발생했습니다. 데모모드를 확인해 주세요.",
      });
    }
  },

  fullReset: async () => {
    if (!get().isDemoMode) {
      try {
        await postDemoReset(get().aircraftId);
      } catch {
        /* continue */
      }
    }
    set({
      messages: [
        {
          id: `sys-${Date.now()}`,
          role: "system",
          text: "상태가 초기화되었습니다.",
          time: nowTime(),
        },
      ],
      manuals: [],
      failures: [],
      similarHistory: [],
      historyInsight: null,
      historyRegisterPending: false,
      guideStep: 0,
      diagnosisResult: null,
      error: null,
      activeAreaId: null,
      activeFault: null,
      areaLoadStatus: "idle",
      areaLoadProgress: 0,
      areaForceProxy: false,
      ...EMPTY_INSPECTION,
      ...buildTargetFields(FALLBACK_ID, null),
    });
  },
}));

export function getViewTarget(id: string): ViewTargetConfig {
  return targets[id] ?? targets[FALLBACK_ID];
}
