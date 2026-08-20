import { useEffect, useMemo } from "react";
import { useAppStore } from "../stores/useAppStore";
import {
  searchSimilarLocal,
  similarQueryFromDiagnosis,
  listHistoryLocal,
} from "../services/maintenanceHistoryService";

/**
 * Bottom tab [유사 고장] — always derives cases from maintenanceHistory.json
 * via symptom_code (never 3D mesh IDs). Self-heals if store was empty.
 */
export function FailureCasePanel() {
  const storeSimilar = useAppStore((s) => s.similarHistory);
  const result = useAppStore((s) => s.diagnosisResult);
  const aircraftId = useAppStore((s) => s.aircraftId);
  const setActiveBottomTab = useAppStore((s) => s.setActiveBottomTab);
  const setSimilarHistory = useAppStore((s) => s.setSimilarHistory);

  const similar = useMemo(() => {
    if (!result) return [];
    if (storeSimilar.length > 0) return storeSimilar;
    const q = similarQueryFromDiagnosis(result, aircraftId);
    return searchSimilarLocal(q, q.top_k ?? 7);
  }, [result, storeSimilar, aircraftId]);

  useEffect(() => {
    if (result && storeSimilar.length === 0 && similar.length > 0) {
      setSimilarHistory(similar);
    }
  }, [result, storeSimilar.length, similar, setSimilarHistory]);

  if (!result) {
    return (
      <p className="text-sm text-slate-500">
        질의 후 유사 고장사례(모의)가 표시됩니다.
      </p>
    );
  }

  if (!similar.length) {
    const seedN = listHistoryLocal({}).length;
    return (
      <div className="space-y-2 text-sm text-slate-500">
        <p>현재 진단과 유사한 정비이력을 찾지 못했습니다.</p>
        <p className="text-xs">
          증상코드: {result.symptom_code} · 계통: {result.system_code} · 시드{" "}
          {seedN}건
        </p>
        <button
          type="button"
          className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
          onClick={() => setActiveBottomTab("history")}
        >
          정비이력 전체보기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-navy">
          유사 정비사례 {similar.length}건
        </h3>
        <span className="text-[11px] text-slate-400">
          참고정보 · {result.symptom_code}
        </span>
      </div>
      {similar.map((s) => {
        const r = s.record;
        return (
          <article
            key={r.maintenance_id}
            className="rounded border border-slate-200 p-2.5 text-sm"
          >
            <div className="flex justify-between gap-2">
              <span className="font-medium text-navy">
                {s.similarity_percent}% · {r.maintenance_id}
              </span>
              <span className="shrink-0 text-[11px] text-slate-500">
                {r.maintenance_date} · {r.aircraft_id}
              </span>
            </div>
            <p className="mt-1 text-slate-800">
              {r.symptom}
              {r.detected_value ? ` (${r.detected_value})` : ""}
            </p>
            <p className="mt-0.5 text-xs text-slate-700">
              <span className="text-slate-500">원인</span> {r.root_cause}
            </p>
            <p className="text-xs text-slate-700">
              <span className="text-slate-500">조치</span> {r.maintenance_action}
            </p>
            <p className="text-xs text-slate-700">
              <span className="text-slate-500">결과</span> {r.maintenance_result}
            </p>
          </article>
        );
      })}
      <button
        type="button"
        className="w-full rounded border border-slate-200 py-1.5 text-xs hover:bg-slate-50"
        onClick={() => setActiveBottomTab("history")}
      >
        유사 정비이력 전체보기
      </button>
    </div>
  );
}
