import { useAppStore } from "../stores/useAppStore";

export function ManualPanel() {
  const manuals = useAppStore((s) => s.manuals);

  if (!manuals.length) {
    return (
      <p className="text-sm text-slate-500">
        질의 후 관련 공개 교범이 표시됩니다.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {manuals.map((m) => (
        <article
          key={m.id}
          className="rounded border border-slate-200 p-2 text-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-navy">{m.title}</h3>
            {m.is_demo_public_tm ? (
              <span className="rounded bg-sky-100 px-1.5 text-[10px] text-sky-900">
                Public TM
              </span>
            ) : m.is_dummy ? (
              <span className="rounded bg-amber-100 px-1.5 text-[10px] text-amber-800">
                더미
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-700">
            {m.source_manual ?? m.id}
          </p>
          <p className="text-[11px] text-slate-500">
            {m.paragraph || (m as { task?: string }).task
              ? `Task ${m.paragraph ?? (m as { task?: string }).task}`
              : null}
            {(m as { pdf_page?: number }).pdf_page != null || m.page
              ? ` · PDF Page ${(m as { pdf_page?: number }).pdf_page ?? m.page}`
              : null}
            {m.chapter ? ` · Ch.${m.chapter}` : ""}
          </p>
          <p className="text-[10px] text-slate-400">
            Public Technical Manual / DEMO Reference
          </p>
          {m.symptom_ko || m.symptom_en ? (
            <p className="mt-1 text-xs text-slate-600">
              {m.symptom_ko}
              {m.symptom_en ? ` / ${m.symptom_en}` : ""}
            </p>
          ) : null}
          {m.possible_causes && m.possible_causes.length > 0 ? (
            <div className="mt-1 text-xs text-slate-700">
              <div className="text-[11px] text-slate-500">가능한 원인</div>
              <ul className="list-inside list-disc">
                {m.possible_causes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="mt-1 text-slate-700">{m.content}</p>
          {m.original_text ? (
            <details className="mt-1">
              <summary className="cursor-pointer text-[11px] text-slate-500">
                Original English excerpt
              </summary>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                {m.original_text}
              </p>
            </details>
          ) : null}
          {m.td_grade === "COMPONENT" ? (
            <p className="mt-1 text-[10px] text-slate-500">
              관련 장비 위치를 3D 모델에 표시합니다.
            </p>
          ) : m.td_grade === "SYSTEM" ? (
            <p className="mt-1 text-[10px] text-slate-500">
              관련 계통의 위치를 3D 모델에 표시합니다.
            </p>
          ) : m.td_grade === "AREA" ? (
            <p className="mt-1 text-[10px] text-slate-500">
              관련 장비가 위치한 영역을 3D 모델에 표시합니다.
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
