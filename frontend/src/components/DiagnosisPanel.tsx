import { useAppStore } from "../stores/useAppStore";
import {
  labelComponent,
  labelRisk,
  labelSystem,
  relatedEquipmentHeading,
  tdLocationSentence,
} from "../services/displayLabels";
import { SimilarMaintenanceCases } from "./SimilarMaintenanceCases";

export function DiagnosisPanel() {
  const result = useAppStore((s) => s.diagnosisResult);
  const historyInsight = useAppStore((s) => s.historyInsight);
  const applyViewTarget = useAppStore((s) => s.applyViewTarget);
  const setActiveBottomTab = useAppStore((s) => s.setActiveBottomTab);
  const openPanel = useAppStore((s) => s.openPanel);

  const riskColor: Record<string, string> = {
    HIGH: "text-danger",
    MEDIUM: "text-amber-600",
    LOW: "text-emerald-600",
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-3 py-2">
        <h2 className="text-sm font-semibold text-navy">핵심 분석정보</h2>
        <p className="text-[11px] text-slate-500">이상 · 위협 · 권고 · 출처</p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 text-sm">
        {!result ? (
          <p className="text-slate-500">질의 후 분석 결과가 표시됩니다.</p>
        ) : (
          <>
            <Row label="이상 계통" value={labelSystem(result.system_code)} danger />
            <Row
              label="위험 수준"
              value={labelRisk(result.risk_level)}
              className={riskColor[result.risk_level]}
            />
            <div>
              <div className="text-[11px] text-slate-500">
                {relatedEquipmentHeading(result.td_grade)}
              </div>
              <ul className="mt-1 list-inside list-disc text-slate-800">
                {result.suspected_components.map((c) => (
                  <li key={c}>{labelComponent(c)}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">권장 확인</div>
              <ul className="mt-1 list-inside list-disc text-slate-800">
                {result.recommended_steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">
                기술교범 근거 <span className="text-slate-400">(공식)</span>
              </div>
              {result.sources && result.sources.length > 0 ? (
                <ul className="mt-1 space-y-2">
                  {result.sources.map((s) => {
                    const pdfPage = s.pdf_page ?? s.page;
                    const task = s.task ?? s.paragraph;
                    return (
                      <li
                        key={`${s.manual_id}-${task}-${pdfPage}`}
                        className="rounded bg-slate-50 p-2 text-xs text-slate-800"
                      >
                        <div className="font-medium text-navy">{s.manual_id}</div>
                        {task ? (
                          <div>
                            Task {task}
                            {pdfPage != null ? ` · PDF p.${pdfPage}` : ""}
                          </div>
                        ) : pdfPage != null ? (
                          <div>PDF p.{pdfPage}</div>
                        ) : null}
                        {s.title ? (
                          <div className="mt-1 text-[10px] text-slate-500">
                            {s.title}
                          </div>
                        ) : null}
                        <div className="mt-1 text-[10px] text-slate-500">
                          Public Technical Manual / DEMO Reference
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="mt-1 text-slate-800">교범 근거 없음</div>
              )}
            </div>
            <SimilarMaintenanceCases />
            {historyInsight ? (
              <div className="rounded border border-amber-100 bg-amber-50/60 p-2 text-xs text-slate-800">
                <div className="text-[11px] font-medium text-navy">
                  AI 종합 판단
                </div>
                <p className="mt-1 leading-relaxed">{historyInsight}</p>
              </div>
            ) : null}
            {result.td_grade ? (
              <div>
                <div className="text-[11px] text-slate-500">3D 위치</div>
                <div className="mt-0.5 text-slate-800">
                  {tdLocationSentence(result.td_grade)}
                </div>
              </div>
            ) : null}
            <div className="rounded bg-slate-50 p-2 text-xs text-slate-600">
              신뢰도 {(result.confidence * 100).toFixed(0)}%
              {result.is_demo ? " · DEMO / Public TM" : ""}
            </div>
            <button
              type="button"
              className="w-full rounded bg-navy py-2 text-xs font-medium text-white hover:bg-navy-700"
              onClick={() => {
                setActiveBottomTab("guide");
                applyViewTarget(result.view_target_id);
              }}
            >
              상세 위치 보기
            </button>
            {result.system_code === "ENGINE_OIL" ? (
              <button
                type="button"
                className="w-full rounded border border-slate-200 py-2 text-xs hover:bg-slate-50"
                onClick={() => openPanel("ENGINE_PANEL_LEFT")}
              >
                패널 열기 / 내부 보기
              </button>
            ) : result.td_grade === "PENDING" ? (
              <p className="text-[11px] text-amber-700">
                현재 3D 모델에서 해당 위치를 표시할 수 없습니다.
              </p>
            ) : (
              <p className="text-[11px] text-slate-600">
                관련 위치를 3D 모델에 표시합니다.
              </p>
            )}
          </>
        )}
      </div>
      <p className="border-t border-slate-100 px-3 py-2 text-[10px] text-slate-400">
        DEMO / Public Technical Manual Reference — 수리온 실교범 아님
      </p>
    </section>
  );
}

function Row({
  label,
  value,
  danger,
  className,
}: {
  label: string;
  value: string;
  danger?: boolean;
  className?: string;
}) {
  return (
    <div>
      <div className="text-[11px] text-slate-500">{label}</div>
      <div
        className={`mt-0.5 font-medium ${danger ? "text-danger" : "text-slate-900"} ${className ?? ""}`}
      >
        {value}
      </div>
    </div>
  );
}
