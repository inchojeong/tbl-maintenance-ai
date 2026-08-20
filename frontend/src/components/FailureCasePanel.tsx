import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../stores/useAppStore";
import {
  searchSimilarLocal,
  similarQueryFromDiagnosis,
  listHistoryLocal,
} from "../services/maintenanceHistoryService";
import type { SimilarMaintenanceItem } from "../types/maintenance";

/**
 * Bottom tab — similar maintenance cases as comparable cards.
 */
export function FailureCasePanel() {
  const storeSimilar = useAppStore((s) => s.similarHistory);
  const result = useAppStore((s) => s.diagnosisResult);
  const aircraftId = useAppStore((s) => s.aircraftId);
  const setActiveBottomTab = useAppStore((s) => s.setActiveBottomTab);
  const setSimilarHistory = useAppStore((s) => s.setSimilarHistory);
  const [expanded, setExpanded] = useState(false);

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
        질의 후 유사 정비사례가 표시됩니다.
      </p>
    );
  }

  if (!similar.length) {
    const seedN = listHistoryLocal({}).length;
    return (
      <div className="space-y-2 text-sm text-slate-500">
        <p>현재 진단과 유사한 정비이력을 찾지 못했습니다.</p>
        <p className="text-xs">
          {result.symptom_code} · 시드 {seedN}건
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

  const top = similar[0];
  const rest = similar.slice(1);
  const shownRest = expanded ? rest : rest.slice(0, 4);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-navy">
          유사 정비사례 {similar.length}건
        </h3>
        <span className="text-[11px] text-slate-400">과거 사례 참고</span>
      </div>

      <div>
        <div className="mb-1.5 text-[11px] font-medium text-slate-500">
          가장 유사한 사례
        </div>
        <CaseCard
          item={top}
          detailed
          onDetail={() => setActiveBottomTab("history")}
        />
      </div>

      {rest.length > 0 ? (
        <div>
          <div className="mb-1.5 text-[11px] font-medium text-slate-500">
            추가 유사사례 {rest.length}건
          </div>
          <ul className="space-y-1.5">
            {shownRest.map((s) => (
              <li key={s.record.maintenance_id}>
                <CompactCase item={s} />
              </li>
            ))}
          </ul>
          {rest.length > 4 ? (
            <button
              type="button"
              className="mt-2 text-[11px] text-navy hover:underline"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "접기" : `나머지 ${rest.length - 4}건 펼치기`}
            </button>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        className="w-full rounded border border-slate-200 py-1.5 text-xs hover:bg-slate-50"
        onClick={() => setActiveBottomTab("history")}
      >
        정비이력에서 전체보기
      </button>
    </div>
  );
}

function CaseCard({
  item,
  detailed,
  onDetail,
}: {
  item: SimilarMaintenanceItem;
  detailed?: boolean;
  onDetail?: () => void;
}) {
  const r = item.record;
  return (
    <article className="rounded border border-slate-200 bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded bg-navy/10 px-2 py-0.5 text-xs font-semibold text-navy">
          유사도 {item.similarity_percent}%
        </span>
        <span className="text-[11px] text-slate-500">
          {r.maintenance_date.replace(/-/g, ".")} · {r.aircraft_id}
        </span>
      </div>
      <h4 className="mt-2 font-medium text-slate-900">
        {r.symptom}
        {r.detected_value ? ` (${r.detected_value})` : ""}
      </h4>
      {detailed ? (
        <dl className="mt-2 grid gap-1 text-xs text-slate-700">
          <div>
            <dt className="inline text-slate-500">원인 </dt>
            <dd className="inline">{r.root_cause}</dd>
          </div>
          <div>
            <dt className="inline text-slate-500">조치 </dt>
            <dd className="inline">{r.maintenance_action}</dd>
          </div>
          <div>
            <dt className="inline text-slate-500">결과 </dt>
            <dd className="inline">{r.maintenance_result}</dd>
          </div>
        </dl>
      ) : null}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          {r.maintenance_id}
        </span>
        {onDetail ? (
          <button
            type="button"
            className="text-[11px] text-navy hover:underline"
            onClick={onDetail}
          >
            상세 이력 보기
          </button>
        ) : null}
      </div>
    </article>
  );
}

function CompactCase({ item }: { item: SimilarMaintenanceItem }) {
  const r = item.record;
  return (
    <div className="rounded border border-slate-100 bg-slate-50 px-2.5 py-2 text-xs text-slate-700">
      <span className="font-semibold text-navy">
        {item.similarity_percent}%
      </span>
      <span className="mx-1 text-slate-400">·</span>
      <span>{r.root_cause}</span>
      <span className="mx-1 text-slate-400">→</span>
      <span>{r.maintenance_action}</span>
      <span className="mx-1 text-slate-400">→</span>
      <span>{r.maintenance_result}</span>
    </div>
  );
}
