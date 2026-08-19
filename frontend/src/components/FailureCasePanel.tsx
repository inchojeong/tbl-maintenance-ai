import { useAppStore } from "../stores/useAppStore";

export function FailureCasePanel() {
  const failures = useAppStore((s) => s.failures);

  if (!failures.length) {
    return (
      <p className="text-sm text-slate-500">
        질의 후 유사 고장사례(모의)가 표시됩니다.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {failures.map((f) => (
        <article key={f.id} className="rounded border border-slate-200 p-2 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-navy">{f.id}</span>
            <span className="text-xs text-slate-500">
              유사도 {(f.similarity * 100).toFixed(0)}%
            </span>
          </div>
          <p className="mt-1">
            <span className="text-slate-500">증상</span> {f.symptom}
          </p>
          <p>
            <span className="text-slate-500">원인</span> {f.cause}
          </p>
          <p>
            <span className="text-slate-500">조치</span> {f.actions}
          </p>
          {f.is_dummy ? (
            <p className="mt-1 text-[10px] text-amber-700">모의 사례</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
