import {
  guideStepsForSystem,
  useAppStore,
} from "../stores/useAppStore";
import type { GuideStep } from "../types/diagnosis";
import { labelSystem } from "../services/displayLabels";

export function MaintenanceGuidePanel() {
  const guideStep = useAppStore((s) => s.guideStep);
  const setGuideStep = useAppStore((s) => s.setGuideStep);
  const result = useAppStore((s) => s.diagnosisResult);
  const similar = useAppStore((s) => s.similarHistory);
  const historyInsight = useAppStore((s) => s.historyInsight);
  const applyViewTarget = useAppStore((s) => s.applyViewTarget);
  const openHistoryRegister = useAppStore((s) => s.openHistoryRegister);

  const curated = guideStepsForSystem(result?.system_code);
  const steps: GuideStep[] =
    result && curated.length
      ? curated
      : result?.recommended_steps?.length
        ? result.recommended_steps.map((detail, i) => ({
            n: i + 1,
            title: `점검 ${i + 1}`,
            detail,
            viewTargetId: result.view_target_id || "AIRCRAFT_OVERVIEW",
          }))
        : curated;

  return (
    <div className="space-y-3">
      {result ? (
        <div className="grid gap-2 md:grid-cols-3">
          <div className="rounded border border-slate-200 p-2 text-xs">
            <div className="text-[11px] font-medium text-navy">
              ① 현재 상태 분석
            </div>
            <p className="mt-1 text-slate-700">
              {labelCurrent(result.system_code, result.symptom_code)}
            </p>
          </div>
          <div className="rounded border border-slate-200 p-2 text-xs">
            <div className="text-[11px] font-medium text-navy">
              ② 기술교범{" "}
              <span className="font-normal text-slate-400">(공식 정비근거)</span>
            </div>
            <p className="mt-1 text-slate-700">
              {result.sources?.[0]
                ? `${result.sources[0].manual_id} · Task ${result.sources[0].task ?? result.sources[0].paragraph ?? "—"}`
                : "관련 기술교범을 확인하십시오."}
            </p>
          </div>
          <div className="rounded border border-amber-100 bg-amber-50/40 p-2 text-xs">
            <div className="text-[11px] font-medium text-navy">
              ③ 과거 정비이력{" "}
              <span className="font-normal text-slate-400">(참고)</span>
            </div>
            <p className="mt-1 text-slate-700">
              {similar.length
                ? `유사 ${similar.length}건 · 최고 ${similar[0].similarity_percent}%`
                : "유사 이력 없음"}
            </p>
          </div>
        </div>
      ) : null}

      {historyInsight ? (
        <div className="rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800">
          <div className="font-medium text-navy">AI 종합 판단</div>
          <p className="mt-1 leading-relaxed">{historyInsight}</p>
        </div>
      ) : null}

      <p className="text-xs text-slate-500">
        {result
          ? "점검 단계를 선택하면 3D 모델에서 해당 위치로 이동합니다."
          : "질의 후 시나리오별 점검 단계가 표시됩니다."}
      </p>
      {steps.map((step) => (
        <button
          key={step.n}
          type="button"
          onClick={() => {
            setGuideStep(step.n);
            applyViewTarget(step.viewTargetId);
          }}
          className={`flex w-full items-start gap-2 rounded border px-2 py-2 text-left text-sm ${
            guideStep === step.n
              ? "border-brand bg-brand/5"
              : "border-slate-200 hover:bg-slate-50"
          }`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] text-white">
            {step.n}
          </span>
          <span>
            <span className="font-medium text-navy">{step.title}</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              {step.detail}
            </span>
          </span>
        </button>
      ))}
      {result ? (
        <button
          type="button"
          className="w-full rounded bg-navy py-2 text-xs font-medium text-white hover:bg-navy-700"
          onClick={() => openHistoryRegister()}
        >
          정비 결과 등록
        </button>
      ) : null}
    </div>
  );
}

function labelCurrent(system: string, symptom: string): string {
  if (system === "ENGINE_OIL" || symptom.includes("OIL")) {
    return "엔진오일 압력 관련 이상으로 분석되었습니다. (측정값 예: 31 PSI / 정상 45~65 PSI)";
  }
  if (system === "HYDRAULIC") {
    return "유압 압력 지시 이상으로 분석되었습니다.";
  }
  if (system === "ELECTRICAL") {
    return "발전기·전기계통 이상으로 분석되었습니다.";
  }
  return `${labelSystem(system)} 이상으로 분석되었습니다.`;
}
