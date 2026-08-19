import { useAppStore } from "../stores/useAppStore";

export function DemoControlPanel({ compact = false }: { compact?: boolean }) {
  const isDemoMode = useAppStore((s) => s.isDemoMode);
  const setDemoMode = useAppStore((s) => s.setDemoMode);
  const resetScene = useAppStore((s) => s.resetScene);
  const fullReset = useAppStore((s) => s.fullReset);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="rounded px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-100"
          onClick={() => setDemoMode(!isDemoMode)}
        >
          Demo {isDemoMode ? "ON" : "OFF"}
        </button>
        <button
          type="button"
          className="rounded px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-100"
          onClick={() => resetScene()}
        >
          장면 리셋
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <button
        type="button"
        className="rounded border border-slate-200 px-2 py-1"
        onClick={() => setDemoMode(!isDemoMode)}
      >
        데모모드 {isDemoMode ? "ON" : "OFF"}
      </button>
      <button
        type="button"
        className="rounded border border-slate-200 px-2 py-1"
        onClick={() => resetScene()}
      >
        3D 초기화
      </button>
      <button
        type="button"
        className="rounded bg-navy px-2 py-1 text-white"
        onClick={() => void fullReset()}
      >
        전체 초기화
      </button>
    </div>
  );
}
