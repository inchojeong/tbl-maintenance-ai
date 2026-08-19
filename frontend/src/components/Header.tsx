import { useAppStore } from "../stores/useAppStore";

export function Header() {
  const isDemoMode = useAppStore((s) => s.isDemoMode);
  const setDemoMode = useAppStore((s) => s.setDemoMode);
  const fullReset = useAppStore((s) => s.fullReset);
  const aircraftId = useAppStore((s) => s.aircraftId);
  const error = useAppStore((s) => s.error);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-navy px-4 py-3 text-white">
      <div>
        <h1 className="text-base font-semibold tracking-tight">
          AI 항공기 정비 어시스턴트
        </h1>
        <p className="text-xs text-slate-300">
          {aircraftId} · 시제품 · 모의 데이터
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
