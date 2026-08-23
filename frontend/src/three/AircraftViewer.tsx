import { Canvas } from "@react-three/fiber";
import { AircraftScene } from "./AircraftScene";
import { CutawayAnnotationOverlay } from "./CutawayAnnotationOverlay";
import { useAppStore } from "../stores/useAppStore";
import type {
  ActiveMaintenanceSystem,
  InspectionLevel,
} from "../types/diagnosis";
import {
  labelComponent,
  labelSystem,
  labelViewTarget,
} from "../services/displayLabels";
import { isDebug3DEnabled } from "./maintenance/Debug3DHelpers";

type QuickAction = { label: string; onClick: () => void };

function hierarchicalActions(
  level: InspectionLevel,
  active: ActiveMaintenanceSystem | null,
  enterSystem: () => void,
  enterAssembly: (
    a?:
      | "ENGINE_LEFT"
      | "ENGINE_RIGHT"
      | "GENERATOR_ASSEMBLY"
      | "HYDRAULIC_ASSEMBLY",
  ) => void,
  enterComponent: (id: string) => void,
  goLevel: (l: InspectionLevel) => void,
): QuickAction[] {
  if (active === "HYDRAULIC") {
    if (level === "SYSTEM") {
      return [
        {
          label: "유압 Assembly",
          onClick: () => enterAssembly("HYDRAULIC_ASSEMBLY"),
        },
      ];
    }
    if (level === "ASSEMBLY") {
      return [
        {
          label: "유압 펌프",
          onClick: () => enterComponent("HYDRAULIC_PUMP"),
        },
        {
          label: "유압 센서",
          onClick: () => enterComponent("HYDRAULIC_SENSOR"),
        },
        { label: "유압 배관", onClick: () => enterComponent("HYDRAULIC_LINE") },
        { label: "이전 단계", onClick: () => goLevel("SYSTEM") },
      ];
    }
    return [
      { label: "Assembly 보기", onClick: () => goLevel("ASSEMBLY") },
      { label: "이전 단계", onClick: () => goLevel("ASSEMBLY") },
    ];
  }

  if (active === "GENERATOR") {
    if (level === "SYSTEM") {
      return [
        {
          label: "발전기 Assembly",
          onClick: () => enterAssembly("GENERATOR_ASSEMBLY"),
        },
      ];
    }
    if (level === "ASSEMBLY") {
      return [
        { label: "발전기", onClick: () => enterComponent("GENERATOR") },
        {
          label: "제어·커넥터",
          onClick: () => enterComponent("GENERATOR_CONTROL"),
        },
        { label: "전기 배선", onClick: () => enterComponent("GENERATOR_WIRING") },
        { label: "이전 단계", onClick: () => goLevel("SYSTEM") },
      ];
    }
    return [
      { label: "Assembly 보기", onClick: () => goLevel("ASSEMBLY") },
      { label: "이전 단계", onClick: () => goLevel("ASSEMBLY") },
    ];
  }

  if (active !== "ENGINE_OIL") return [];

  if (level === "EXTERIOR") {
    return [{ label: "엔진 위치 보기", onClick: () => enterSystem() }];
  }
  if (level === "SYSTEM") {
    return [
      { label: "No.1 엔진", onClick: () => enterAssembly("ENGINE_LEFT") },
      { label: "No.2 엔진", onClick: () => enterAssembly("ENGINE_RIGHT") },
      { label: "이전 · 외형", onClick: () => goLevel("EXTERIOR") },
    ];
  }
  if (level === "ASSEMBLY") {
    return [
      {
        label: "오일 압력 센서",
        onClick: () => enterComponent("PRESSURE_SENSOR"),
      },
      { label: "오일 필터", onClick: () => enterComponent("OIL_FILTER") },
      { label: "오일 펌프", onClick: () => enterComponent("OIL_PUMP") },
      { label: "이전 단계", onClick: () => goLevel("SYSTEM") },
    ];
  }
  return [
    { label: "엔진 전체 보기", onClick: () => goLevel("ASSEMBLY") },
    { label: "이전 단계", onClick: () => goLevel("ASSEMBLY") },
  ];
}

function viewerStatus(
  active: ActiveMaintenanceSystem | null,
  diagnosisCode: string | undefined,
  level: InspectionLevel,
  part: string | null,
  viewTargetId: string,
): string {
  if (!active && viewTargetId === "AIRCRAFT_OVERVIEW") return "항공기 전체";
  if (active === "ENGINE_OIL") {
    if (level === "EXTERIOR") return "엔진 오일계통 · 위치 안내";
    if (level === "SYSTEM") return "엔진 오일계통 · Cutaway";
    if (level === "ASSEMBLY") return "엔진 오일계통 · No.1 엔진";
    return `엔진 오일계통 · ${part ? labelComponent(part) : labelViewTarget(viewTargetId)}`;
  }
  if (active === "HYDRAULIC") {
    if (level === "SYSTEM") return "유압계통 · 위치";
    if (level === "ASSEMBLY") return "유압계통 · Assembly";
    return `유압계통 · ${part ? labelComponent(part) : labelViewTarget(viewTargetId)}`;
  }
  if (active === "GENERATOR") {
    if (level === "SYSTEM") return "전기계통 · 발전기 위치";
    if (level === "ASSEMBLY") return "전기계통 · 발전기 Assembly";
    return `전기계통 · ${part ? labelComponent(part) : labelViewTarget(viewTargetId)}`;
  }
  if (diagnosisCode) {
    return `${labelSystem(diagnosisCode)} · ${labelViewTarget(viewTargetId)}`;
  }
  return labelViewTarget(viewTargetId) || "항공기 전체";
}

const OIL_BREADCRUMB: { level: InspectionLevel; label: string }[] = [
  { level: "EXTERIOR", label: "항공기 전체" },
  { level: "SYSTEM", label: "엔진계통" },
  { level: "ASSEMBLY", label: "No.1 엔진" },
  { level: "COMPONENT", label: "부품" },
];

const GEN_BREADCRUMB: { level: InspectionLevel; label: string }[] = [
  { level: "SYSTEM", label: "전기계통" },
  { level: "ASSEMBLY", label: "발전기" },
  { level: "COMPONENT", label: "부품" },
];

const HYD_BREADCRUMB: { level: InspectionLevel; label: string }[] = [
  { level: "SYSTEM", label: "유압계통" },
  { level: "ASSEMBLY", label: "유압 Assembly" },
  { level: "COMPONENT", label: "부품" },
];

export function AircraftViewer() {
  const viewTargetId = useAppStore((s) => s.viewTargetId);
  const modelWarning = useAppStore((s) => s.modelWarning);
  const diagnosisResult = useAppStore((s) => s.diagnosisResult);
  const inspectionLevel = useAppStore((s) => s.inspectionLevel);
  const activeSystem = useAppStore((s) => s.activeMaintenanceSystem);
  const selectedPart = useAppStore((s) => s.selectedMaintenancePart);
  const enterSystem = useAppStore((s) => s.enterInspectionSystem);
  const enterAssembly = useAppStore((s) => s.enterInspectionAssembly);
  const enterComponent = useAppStore((s) => s.enterInspectionComponent);
  const goLevel = useAppStore((s) => s.goInspectionLevel);
  const beginEngineOil = useAppStore((s) => s.beginEngineOilInspection);

  const status = viewerStatus(
    activeSystem,
    diagnosisResult?.system_code,
    inspectionLevel,
    selectedPart,
    viewTargetId,
  );

  const actions = diagnosisResult
    ? hierarchicalActions(
        inspectionLevel,
        activeSystem,
        enterSystem,
        enterAssembly,
        enterComponent,
        goLevel,
      )
    : [];

  const crumb =
    activeSystem === "GENERATOR"
      ? GEN_BREADCRUMB
      : activeSystem === "HYDRAULIC"
        ? HYD_BREADCRUMB
        : OIL_BREADCRUMB;

  const crumbEnd =
    activeSystem === "ENGINE_OIL"
      ? inspectionLevel === "COMPONENT"
        ? 3
        : inspectionLevel === "ASSEMBLY"
          ? 2
          : inspectionLevel === "SYSTEM"
            ? 1
            : 0
      : inspectionLevel === "COMPONENT"
        ? 2
        : inspectionLevel === "ASSEMBLY"
          ? 1
          : 0;

  const showDevViews = import.meta.env.DEV && isDebug3DEnabled();
  const showCrumb =
    activeSystem === "ENGINE_OIL" ||
    activeSystem === "GENERATOR" ||
    activeSystem === "HYDRAULIC";

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            디지털트윈 · 3D
          </h2>
          <p className="text-[11px] text-slate-400">{status}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            실시간
          </span>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [8.5, 3.2, 9.0], fov: 45, near: 0.1, far: 200 }}
        >
          <AircraftScene />
        </Canvas>

        <CutawayAnnotationOverlay />

        {modelWarning && import.meta.env.DEV ? (
          <div className="absolute left-2 top-2 max-w-sm rounded bg-amber-500/90 px-2 py-1 text-[11px] text-slate-950">
            {modelWarning}
          </div>
        ) : null}

        {showCrumb ? (
          <nav className="absolute left-1/2 top-2 z-20 flex max-w-[70%] -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded bg-slate-950/75 px-1.5 py-1 text-[10px] text-slate-300 ring-1 ring-slate-600/80">
            {crumb.slice(0, crumbEnd + 1).map((c, i) => (
              <span key={c.level} className="inline-flex items-center gap-1">
                {i > 0 ? <span className="text-slate-600">›</span> : null}
                <button
                  type="button"
                  className={`hover:text-amber-300 ${
                    i === crumbEnd ? "text-amber-200" : "text-slate-400"
                  }`}
                  onClick={() => goLevel(c.level)}
                >
                  {c.level === "COMPONENT" && selectedPart
                    ? labelComponent(selectedPart)
                    : c.label}
                </button>
              </span>
            ))}
          </nav>
        ) : null}

        {showDevViews ? (
          <div className="absolute right-2 top-2 z-20 flex flex-col gap-0.5 rounded bg-fuchsia-950/80 p-1 text-[9px] text-fuchsia-100 ring-1 ring-fuchsia-500/50">
            <span className="px-1 font-semibold">DEV VIEW</span>
            {(
              [
                ["EXTERIOR", () => beginEngineOil()],
                ["SYSTEM", () => enterSystem()],
                ["ASSEMBLY", () => enterAssembly("ENGINE_LEFT")],
                ["SENSOR", () => enterComponent("PRESSURE_SENSOR")],
                ["FILTER", () => enterComponent("OIL_FILTER")],
              ] as const
            ).map(([label, fn]) => (
              <button
                key={label}
                type="button"
                className="rounded px-1.5 py-0.5 text-left hover:bg-fuchsia-800/80"
                onClick={() => {
                  if (!diagnosisResult) {
                    useAppStore.setState({
                      diagnosisResult: {
                        system_code: "ENGINE_OIL",
                        symptom_code: "ENG_OIL_PRESS_LOW",
                        risk_level: "MEDIUM",
                        suspected_components: ["PRESSURE_SENSOR"],
                        answer: "DEV",
                        manual_ids: [],
                        recommended_steps: [],
                        view_target_id: "ENGINE_ZONE_GUIDE",
                        confidence: 1,
                        is_demo: true,
                      },
                      activeMaintenanceSystem: "ENGINE_OIL",
                      inspectionSystem: "ENGINE_OIL",
                      recommendedMaintenancePart: "PRESSURE_SENSOR",
                    });
                  }
                  fn();
                }}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="absolute bottom-2 left-2 right-2 z-20 flex flex-wrap gap-2">
          {diagnosisResult ? (
            actions.map((a) => (
              <button
                key={a.label}
                type="button"
                className="rounded bg-slate-800/90 px-2 py-1 text-[11px] text-slate-100 ring-1 ring-slate-600 hover:bg-slate-700"
                onClick={a.onClick}
              >
                {a.label}
              </button>
            ))
          ) : (
            <span className="rounded bg-slate-800/80 px-2 py-1 text-[11px] text-slate-300">
              질의를 전송하면 점검 위치가 표시됩니다
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
