import { useAppStore } from "../stores/useAppStore";
import { tdLocationSentence } from "../services/displayLabels";

export function ManualPanel() {
  const manuals = useAppStore((s) => s.manuals);

  if (!manuals.length) {
    return (
      <p className="text-sm text-slate-500">
        질의 후 관련 기술교범이 표시됩니다.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-slate-500">
        기술교범은 공식 정비근거입니다.
      </p>
      {manuals.map((m) => (
        <article
          key={m.id}
          className="rounded border border-slate-200 p-2 text-sm"
        >
          <h3 className="font-medium text-navy">{m.title}</h3>
          <p className="mt-1 text-[11px] font-medium text-slate-700">
            {m.source_manual ?? m.id}
          </p>
          <p className="text-[11px] text-slate-500">
            {m.paragraph || (m as { task?: string }).task
              ? `Task ${m.paragraph ?? (m as { task?: string }).task}`
              : null}
            {(m as { pdf_page?: number }).pdf_page != null || m.page
              ? ` · p.${(m as { pdf_page?: number }).pdf_page ?? m.page}`
              : null}
            {m.chapter ? ` · Ch.${m.chapter}` : ""}
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
          <p className="mt-1 text-slate-700">
            {(m.content || "").replace(/\[DEMO\/Public TM\]\s*/g, "")}
          </p>
          {m.original_text ? (
            <details className="mt-1">
              <summary className="cursor-pointer text-[11px] text-slate-500">
                원문 발췌
              </summary>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                {m.original_text}
              </p>
            </details>
          ) : null}
          {m.td_grade ? (
            <p className="mt-1 text-[10px] text-slate-500">
              {tdLocationSentence(m.td_grade)}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
