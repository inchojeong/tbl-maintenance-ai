import { Canvas } from "@react-three/fiber";
import { AircraftScene } from "./AircraftScene";
import { useAppStore } from "../stores/useAppStore";
import {
  labelArea,
  labelViewTarget,
  viewerStatusLine,
} from "../services/displayLabels";

export function AircraftViewer() {
  const viewLevel = useAppStore((s) => s.viewLevel);
  const viewTargetId = useAppStore((s) => s.viewTargetId);
  const modelWarning = useAppStore((s) => s.modelWarning);
  const openPanel = useAppStore((s) => s.openPanel);
  const applyViewTarget = useAppStore((s) => s.applyViewTarget);
  const diagnosisResult = useAppStore((s) => s.diagnosisResult);
  const activeAreaId = useAppStore((s) => s.activeAreaId);
  const areaLoadStatus = useAppStore((s) => s.areaLoadStatus);
  const areaLoadProgress = useAppStore((s) => s.areaLoadProgress);
  const activeFault = useAppStore((s) => s.activeFault);

  const status =
    diagnosisResult?.system_code === "ENGINE_OIL"
      ? viewerStatusLine({
          viewLevel,
          viewTargetId,
          activeAreaId,
        })
      : labelViewTarget(viewTargetId) || "항공기 전체";

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            디지털트윈 · 3D
          </h2>
          <p className="text-[11px] text-slate-400">
            {status || "항공기 전체"}
          </p>
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

        {modelWarning ? (
          <div className="absolute left-2 top-2 max-w-sm rounded bg-amber-500/90 px-2 py-1 text-[11px] text-slate-950">
            {modelWarning.replace(/프록시/g, "대체").replace(/GLB/g, "상세 모델")}
          </div>
        ) : null}

        {areaLoadStatus === "loading" ? (
          <div className="absolute left-2 right-2 top-2 rounded bg-slate-950/80 px-2 py-1.5 text-[11px] text-slate-100">
            정비구역 모델 로딩 중… {areaLoadProgress}%
            <div className="mt-1 h-1 overflow-hidden rounded bg-slate-700">
              <div
                className="h-full bg-brand transition-all"
                style={{ width: `${areaLoadProgress}%` }}
              />
            </div>
          </div>
        ) : null}

        {activeFault && areaLoadStatus === "proxy" ? (
          <div className="absolute right-2 top-2 rounded bg-slate-800/90 px-2 py-1 text-[10px] text-slate-300 ring-1 ring-slate-600">
            점검 위치 상세
            {labelArea(activeFault.area.area_id)
              ? ` · ${labelArea(activeFault.area.area_id)}`
              : ""}
          </div>
        ) : null}

        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-2">
          {diagnosisResult ? (
            <>
              <button
                type="button"
                className="rounded bg-slate-800/90 px-2 py-1 text-[11px] text-slate-100 ring-1 ring-slate-600 hover:bg-slate-700"
                onClick={() => applyViewTarget("ENGINE_OIL_SYSTEM")}
              >
                엔진 구역
              </button>
              <button
                type="button"
                className="rounded bg-brand px-2 py-1 text-[11px] text-white hover:bg-brand-600"
                onClick={() => openPanel("ENGINE_PANEL_LEFT")}
              >
                패널 열기
              </button>
              <button
                type="button"
                className="rounded bg-slate-800/90 px-2 py-1 text-[11px] text-slate-100 ring-1 ring-slate-600 hover:bg-slate-700"
                onClick={() => applyViewTarget("ENGINE_OIL_FILTER")}
              >
                오일 필터
              </button>
            </>
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
