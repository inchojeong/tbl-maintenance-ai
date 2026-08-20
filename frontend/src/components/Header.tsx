import { useEffect } from "react";
import { useAppStore } from "../stores/useAppStore";
import { listAircraftLocal } from "../services/maintenanceHistoryService";

export function Header() {
  const isDemoMode = useAppStore((s) => s.isDemoMode);
  const setDemoMode = useAppStore((s) => s.setDemoMode);
  const fullReset = useAppStore((s) => s.fullReset);
  const aircraftId = useAppStore((s) => s.aircraftId);
  const aircraftInfo = useAppStore((s) => s.aircraftInfo);
  const setAircraftId = useAppStore((s) => s.setAircraftId);
  const refreshAircraft = useAppStore((s) => s.refreshAircraft);
  const error = useAppStore((s) => s.error);
  const options = listAircraftLocal();

  useEffect(() => {
    void refreshAircraft();
  }, [refreshAircraft]);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-navy px-4 py-3 text-white">
      <div>
        <h1 className="text-base font-semibold tracking-tight">
          AI 항공기 정비 어시스턴트
        </h1>
        <p className="text-xs text-slate-300">
          {aircraftInfo?.display_name || aircraftId} · 시제품 · 모의 데이터
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 rounded border border-white/20 px-2 py-1 text-xs">
          <span className="text-slate-300">항공기</span>
          <select
            className="rounded bg-navy/40 px-1 py-0.5 text-white outline-none"
            value={aircraftId}
            onChange={(e) => setAircraftId(e.target.value)}
          >
            {options.map((a) => (
              <option key={a.aircraft_id} value={a.aircraft_id}>
                {a.aircraft_type}-{a.aircraft_number}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 rounded border border-white/20 px-2 py-1 text-xs">
          <input
            type="checkbox"
            checked={isDemoMode}
            onChange={(e) => setDemoMode(e.target.checked)}
          />
          데모모드
        </label>
        <button
          type="button"
          onClick={() => void fullReset()}
          className="rounded bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
        >
          초기화
        </button>
      </div>
      {error ? (
        <div className="basis-full rounded bg-red-500/20 px-2 py-1 text-xs text-red-100">
          {error}
        </div>
      ) : null}
    </header>
  );
}
