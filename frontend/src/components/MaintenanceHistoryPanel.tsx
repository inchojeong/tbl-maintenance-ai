import { FormEvent, useState } from "react";
import { postMaintenanceResult } from "../services/queryService";
import { useAppStore } from "../stores/useAppStore";

export function MaintenanceHistoryPanel() {
  const aircraftId = useAppStore((s) => s.aircraftId);
  const [actions, setActions] = useState("오일 필터 교체(모의)");
  const [outcome, setOutcome] = useState("압력 회복 확인(모의)");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const res = await postMaintenanceResult({
        aircraft_id: aircraftId,
        actions,
        parts_used: "DUMMY-FILTER-01",
        outcome,
      });
      setSavedId(res.id);
    } catch {
      setErr("저장에 실패했습니다. 백엔드 연결을 확인하세요.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-2 text-sm">
      <p className="text-xs text-slate-500">시제품용 정비결과 등록 (SQLite)</p>
      <label className="block">
        <span className="text-[11px] text-slate-500">조치 내용</span>
        <input
          className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5"
          value={actions}
          onChange={(e) => setActions(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-[11px] text-slate-500">결과</span>
        <input
          className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5"
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
        />
      </label>
      <button
        type="submit"
        className="rounded bg-navy px-3 py-1.5 text-xs text-white hover:bg-navy-700"
      >
        결과 등록
      </button>
      {savedId ? <p className="text-xs text-emerald-600">저장됨: {savedId}</p> : null}
      {err ? <p className="text-xs text-danger">{err}</p> : null}
    </form>
  );
}
