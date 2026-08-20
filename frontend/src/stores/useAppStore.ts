import { create } from "zustand";
import type {
  BottomTab,
  ChatMessage,
  DiagnosisResult,
  FailureCase,
  GuideStep,
  ManualChunk,
  PhmStatus,
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
  fetchPhm,
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
    title: "항공기 전체에서 엔진 위치 확인",
    detail: "엔진 오일계통 접근 구역을 확인합니다.",
    viewTargetId: "ENGINE_OIL_SYSTEM",
  },
  {
    n: 2,
    title: "엔진 접근패널 확인",
    detail: "좌·우측 접근패널 상태를 확인합니다.",
    viewTargetId: "ENGINE_ACCESS_PANEL",
  },
  {
    n: 3,
    title: "접근패널 개방",
    detail: "접근패널을 개방하고 내부를 투시합니다.",
    viewTargetId: "ENGINE_INTERNAL_VIEW",
  },
  {
    n: 4,
    title: "오일 필터 점검",
    detail: "오일 필터 외관 및 차압을 확인합니다.",
    viewTargetId: "ENGINE_OIL_FILTER",
  },
  {
    n: 5,
    title: "오일 펌프 확인",
    detail: "오일 펌프 상태를 확인합니다.",
    viewTargetId: "ENGINE_OIL_PUMP",
  },
  {
    n: 6,
    title: "압력센서 확인",
    detail: "압력센서 신호를 확인합니다.",
    viewTargetId: "ENGINE_PRESSURE_SENSOR",
  },
];

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
  guideStep: number;
  diagnosisResult: DiagnosisResult | null;
  messages: ChatMessage[];
  manuals: ManualChunk[];
  failures: FailureCase[];
  similarHistory: SimilarMaintenanceItem[];
  historyInsight: string | null;
  historyRegisterPending: boolean;
  phm: PhmStatus | null;
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
  submitQuery: (text: string) => Promise<void>;
  loadRelatedData: () => Promise<void>;
  refreshAircraft: () => Promise<void>;
  fullReset: () => Promise<void>;
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

  return {
    viewTargetId: resolvedId,
    viewLevel: cfg.level as ViewLevel,
    highlightedObjects: expandMeshIds(rawHighlight, entry),
    hiddenObjects: expandMeshIds(rawHide, entry),
    transparentObjects: expandMeshIds(rawTransparent, entry),
    openedPanels: expandMeshIds(rawOpen, entry),
    xrayMode: cfg.transparentObjects.length > 0,
    selectedSystem: cfg.level !== "AIRCRAFT" ? "ENGINE_OIL" : null,
    selectedComponent:
      expandMeshIds(rawHighlight, entry).find((o) =>
        [
          "OIL_FILTER",
          "AREA_01_PART_01",
          "OIL_PUMP",
          "PRESSURE_SENSOR",
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
  guideStep: 0,
  diagnosisResult: null,
  messages: [
    {
      id: "sys-1",
      role: "system",
      text: "더미 데이터 시연 모드입니다. 예: 「엔진 오일 압력이 낮고 경고등이 점등되었어.」",
      time: nowTime(),
    },
  ],
  manuals: [],
  failures: [],
  similarHistory: [],
  historyInsight: null,
  historyRegisterPending: false,
  phm: null,
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
      });
      return;
    }

    const current = get().viewTargetId;
    const next = buildTargetFields(id, fault);
    if (
      current === next.viewTargetId &&
      JSON.stringify(next.highlightedObjects) ===
        JSON.stringify(get().highlightedObjects) &&
      JSON.stringify(next.hiddenObjects) === JSON.stringify(get().hiddenObjects)
    ) {
      return;
    }
    set({ error: null, ...next });
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
                  : objectId;

    if (objectId === "AREA_01_HOTSPOT" || legacy === "ENGINE_ZONE") {
      get().ensureAreaLoaded("AREA_01");
      const { viewTargetId } = get();
      if (
        viewTargetId === "ENGINE_OIL_SYSTEM" ||
        viewTargetId === "AREA_01_OVERVIEW"
      ) {
        get().applyViewTarget("ENGINE_ACCESS_PANEL");
        return;
      }
      get().applyViewTarget("ENGINE_OIL_SYSTEM");
      return;
    }

    const entry = (
      componentMap.objects as Record<
        string,
        { clickable?: boolean; viewTargetId?: string | null }
      >
    )[legacy];

    if (!entry?.clickable && !objectId.startsWith("AREA_01_")) return;

    const { viewTargetId } = get();

    if (
      (legacy === "ENGINE_PANEL_LEFT" ||
        legacy === "ENGINE_PANEL_RIGHT" ||
        objectId.startsWith("AREA_01_COVER_")) &&
      (viewTargetId === "ENGINE_ACCESS_PANEL" ||
        viewTargetId === "ENGINE_OIL_SYSTEM")
    ) {
      get().openPanel(
        objectId === "AREA_01_COVER_02" || legacy === "ENGINE_PANEL_RIGHT"
          ? "ENGINE_PANEL_RIGHT"
          : "ENGINE_PANEL_LEFT",
      );
      return;
    }

    if (legacy === "OIL_FILTER" || objectId === "AREA_01_PART_01") {
      get().applyViewTarget("ENGINE_OIL_FILTER");
      return;
    }
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
        new Set([
          ...get().transparentObjects,
          ...expandMeshIds(["AIRCRAFT_BODY"], fault?.fault ?? null),
        ]),
      ),
      xrayMode: true,
    });
    get().applyViewTarget("ENGINE_INTERNAL_VIEW");
  },

  setGuideStep: (step) => {
    const s = GUIDE_STEPS.find((g) => g.n === step);
    set({ guideStep: step, activeBottomTab: "guide" });
    if (s) {
      if (step >= 1) get().ensureAreaLoaded("AREA_01");
      get().applyViewTarget(s.viewTargetId);
    }
  },

  resetScene: () => {
    set({
      ...buildTargetFields(FALLBACK_ID, null),
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
        phm: null,
        similarHistory: similar,
        historyInsight: insight,
      });
      void get().refreshAircraft();
      return;
    }
    try {
      const [manuals, _legacyFailures, phm] = await Promise.all([
        fetchManuals(diagnosisResult?.system_code ?? "ENGINE_OIL"),
        fetchFailures(diagnosisResult?.symptom_code).catch(() => []),
        fetchPhm(aircraftId),
      ]);
      set({
        manuals: manuals.length ? manuals : localManuals,
        // Prefer maintenance-history similar cases over legacy /api/failures
        failures: failureCases.length ? failureCases : _legacyFailures,
        phm,
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
        get().applyResolvedFault(resolved, result.view_target_id);
      } else {
        get().applyViewTarget(result.view_target_id);
      }
      // manuals / PHM etc. (similarHistory already set above)
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
          text: "시연 상태가 초기화되었습니다.",
          time: nowTime(),
        },
      ],
      manuals: [],
      failures: [],
      similarHistory: [],
      historyInsight: null,
      historyRegisterPending: false,
      phm: null,
      guideStep: 0,
      diagnosisResult: null,
      error: null,
      activeAreaId: null,
      activeFault: null,
      areaLoadStatus: "idle",
      areaLoadProgress: 0,
      areaForceProxy: false,
      ...buildTargetFields(FALLBACK_ID, null),
    });
  },
}));

export function getViewTarget(id: string): ViewTargetConfig {
  return targets[id] ?? targets[FALLBACK_ID];
}
