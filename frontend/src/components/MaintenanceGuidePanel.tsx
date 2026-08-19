import { GUIDE_STEPS, useAppStore } from "../stores/useAppStore";
import type { GuideStep } from "../types/diagnosis";

export function MaintenanceGuidePanel() {
  const guideStep = useAppStore((s) => s.guideStep);
  const setGuideStep = useAppStore((s) => s.setGuideStep);
  const result = useAppStore((s) => s.diagnosisResult);
  const applyViewTarget = useAppStore((s) => s.applyViewTarget);

  const steps: GuideStep[] =
    result?.recommended_steps?.length
      ? result.recommended_steps.map((detail, i) => ({
          n: i + 1,
          title: `점검 ${i + 1}`,
          detail,
          viewTargetId: result.view_target_id || "AIRCRAFT_OVERVIEW",
        }))
      : GUIDE_STEPS;

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">
        {result?.recommended_steps?.length
          ? "현재 진단의 권장 확인 항목을 가이드로 표시합니다."
          : "기본 오일계통 가이드입니다. 질의 후 시나리오별 단계로 전환됩니다."}
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
    </div>
  );
}
