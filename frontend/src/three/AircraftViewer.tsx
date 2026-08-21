import { Canvas } from "@react-three/fiber";
import { AircraftScene } from "./AircraftScene";
import { useAppStore } from "../stores/useAppStore";
import {
  labelComponent,
  labelSystem,
  labelViewTarget,
} from "../services/displayLabels";

type QuickAction = { label: string; onClick: () => void };

function actionsForSystem(
  system: string | undefined,
  applyViewTarget: (id: string) => void,
): QuickAction[] {
  if (system === "HYDRAULIC") {
    return [
      { label: "유압 계통", onClick: () => applyViewTarget("HYDRAULIC_OVERVIEW") },
      { label: "유압 펌프", onClick: () => applyViewTarget("HYDRAULIC_PUMP") },
      { label: "유압 배관", onClick: () => applyViewTarget("HYDRAULIC_LINE") },
    ];
  }
  if (system === "ELECTRICAL") {
    return [
      {
        label: "발전기 위치",
        onClick: () => applyViewTarget("GENERATOR_OVERVIEW"),
      },
      { label: "발전기", onClick: () => applyViewTarget("GENERATOR_DETAIL") },
      { label: "전기 배선", onClick: () => applyViewTarget("GENERATOR_WIRING") },
    ];
  }
  // ENGINE_OIL and default oil-related
  return [
    { label: "엔진 위치", onClick: () => applyViewTarget("ENGINE_OVERVIEW") },
    {
      label: "오일 압력 센서",
      onClick: () => applyViewTarget("ENGINE_PRESSURE_SENSOR"),
    },
    { label: "오일 필터", onClick: () => applyViewTarget("ENGINE_OIL_FILTER") },
  ];
}

function viewerStatus(
  system: string | undefined,
  viewTargetId: string,
  highlighted: string[],
): string {
  if (!system && viewTargetId === "AIRCRAFT_OVERVIEW") {
    return "항공기 전체";
  }

  const primary =
    highlighted.find((h) =>
      [
        "PRESSURE_SENSOR",
        "OIL_FILTER",
        "OIL_PUMP",
        "HYDRAULIC_PUMP",
        "HYDRAULIC_SENSOR",
        "HYDRAULIC_LINE",
        "GENERATOR",
        "GENERATOR_WIRING",
        "ENGINE_BLOCK",
      ].includes(h),
    ) ?? null;

  if (system === "ENGINE_OIL") {
    const part = primary ? labelComponent(primary) : labelViewTarget(viewTargetId);
    return `엔진 오일계통 · ${part}`;
  }
  if (system === "HYDRAULIC") {
    const part = primary
      ? labelComponent(primary)
      : labelViewTarget(viewTargetId) || "유압계통";
    return `유압계통 · ${part}`;
  }
  if (system === "ELECTRICAL") {
    const part = primary
      ? labelComponent(primary)
      : labelViewTarget(viewTargetId) || "발전기";
    return `전기계통 · ${part}`;
  }

  if (system) {
    return `${labelSystem(system)} · ${labelViewTarget(viewTargetId)}`;
  }
  return labelViewTarget(viewTargetId) || "항공기 전체";
}

export function AircraftViewer() {
  const viewTargetId = useAppStore((s) => s.viewTargetId);
  const modelWarning = useAppStore((s) => s.modelWarning);
  const applyViewTarget = useAppStore((s) => s.applyViewTarget);
  const diagnosisResult = useAppStore((s) => s.diagnosisResult);
  const highlightedObjects = useAppStore((s) => s.highlightedObjects);

  const status = viewerStatus(
    diagnosisResult?.system_code,
    viewTargetId,
    highlightedObjects,
  );

  const actions = diagnosisResult
    ? actionsForSystem(diagnosisResult.system_code, applyViewTarget)
    : [];

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

        {modelWarning && import.meta.env.DEV ? (
          <div className="absolute left-2 top-2 max-w-sm rounded bg-amber-500/90 px-2 py-1 text-[11px] text-slate-950">
            {modelWarning}
          </div>
        ) : null}

        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-2">
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
