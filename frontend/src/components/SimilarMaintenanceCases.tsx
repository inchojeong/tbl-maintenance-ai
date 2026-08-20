import { useAppStore } from "../stores/useAppStore";

/** Compact similar-history block for DiagnosisPanel. */
export function SimilarMaintenanceCases() {
  const similar = useAppStore((s) => s.similarHistory);
  const setActiveBottomTab = useAppStore((s) => s.setActiveBottomTab);

  if (!similar.length) return null;
  const top = similar[0];

  return (
    <div className="space-y-2 rounded border border-slate-200 bg-slate-50 p-2">
      <div className="text-[11px] font-medium text-navy">과거 유사 정비사례</div>
      <p className="text-[11px] text-slate-600">
        과거 동일·유사 사례 {similar.length}건 발견
        <span className="ml-1 text-slate-400">(참고정보)</span>
      </p>
      <div className="rounded bg-white p-2 text-xs text-slate-800">
        <div className="font-medium text-navy">
          가장 유사한 사례 · 유사도 {top.similarity_percent}%
        </div>
        <div className="mt-1 text-slate-600">
          {top.record.maintenance_date} / {top.record.aircraft_id}
        </div>
        <div>증상: {top.record.symptom}
          {top.record.detected_value ? ` (${top.record.detected_value})` : ""}
        </div>
        <div>원인: {top.record.root_cause}</div>
        <div>조치: {top.record.maintenance_action}</div>
        <div>결과: {top.record.maintenance_result}</div>
      </div>
      <button
        type="button"
        className="w-full rounded border border-slate-200 py-1.5 text-[11px] hover:bg-white"
        onClick={() => setActiveBottomTab("history")}
      >
        유사 정비이력 전체보기
      </button>
    </div>
  );
}
