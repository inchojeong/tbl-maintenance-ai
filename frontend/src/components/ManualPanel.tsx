import { useState } from "react";
import { useAppStore } from "../stores/useAppStore";
import { tdLocationSentence } from "../services/displayLabels";
import type { ManualChunk } from "../types/diagnosis";
import {
  isBundledManualPdf,
  manualPageImageUrl,
  manualPdfUrl,
} from "../services/manualAssets";
import { ManualPageModal } from "./ManualPageModal";

export function ManualPanel() {
  const manuals = useAppStore((s) => s.manuals);
  const [zoom, setZoom] = useState<{ url: string; title: string } | null>(null);

  if (!manuals.length) {
    return (
      <p className="text-sm text-slate-500">
        질의 후 관련 기술교범이 표시됩니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-500">
        기술교범은 공식 정비근거입니다. 원본 페이지는 공개 CH-47D 교범 시연용입니다.
      </p>
      {manuals.map((m) => (
        <ManualCard
          key={m.id}
          manual={m}
          onZoom={(url, title) => setZoom({ url, title })}
        />
      ))}
      <ManualPageModal
        open={Boolean(zoom)}
        imageUrl={zoom?.url ?? ""}
        title={zoom?.title ?? ""}
        onClose={() => setZoom(null)}
      />
    </div>
  );
}

function ManualCard({
  manual: m,
  onZoom,
}: {
  manual: ManualChunk;
  onZoom: (url: string, title: string) => void;
}) {
  const task = m.task ?? m.paragraph;
  const pdfPage = m.pdf_page ?? m.page;
  const imageUrl = manualPageImageUrl(m.page_image);
  const pdfUrl = manualPdfUrl(m.pdf_file, pdfPage);
  const showPdf = Boolean(pdfUrl && isBundledManualPdf(m.pdf_file));

  return (
    <article className="rounded border border-slate-200 p-3 text-sm">
      <h3 className="font-medium text-navy">{m.title}</h3>
      <p className="mt-1 text-[11px] font-medium text-slate-700">
        {m.source_manual ?? m.id}
      </p>
      <p className="text-[11px] text-slate-500">
        {task ? `Task ${task}` : null}
        {pdfPage != null ? ` · PDF p.${pdfPage}` : null}
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

      <p className="mt-2 text-slate-700">
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

      {imageUrl ? (
        <div className="mt-3 border-t border-slate-200 pt-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold text-navy">원본 기술교범</h4>
            <span className="text-[10px] text-slate-500">
              공개 기술교범 기반 시연 자료
            </span>
          </div>
          <button
            type="button"
            className="block w-full overflow-hidden rounded border border-slate-200 bg-slate-50 text-left hover:border-brand/40"
            onClick={() =>
              onZoom(
                imageUrl,
                `${m.source_manual ?? ""} · Task ${task ?? ""} · p.${pdfPage ?? ""}`,
              )
            }
          >
            <img
              src={imageUrl}
              alt={`${m.source_manual ?? "Manual"} page ${pdfPage ?? ""}`}
              className="mx-auto h-auto w-full max-w-3xl object-contain"
              loading="lazy"
            />
          </button>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-navy px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-navy-700"
              onClick={() =>
                onZoom(
                  imageUrl,
                  `${m.source_manual ?? ""} · Task ${task ?? ""} · p.${pdfPage ?? ""}`,
                )
              }
            >
              확대 보기
            </button>
            {showPdf && pdfUrl ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
              >
                원본 PDF 보기
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {m.td_grade ? (
        <p className="mt-2 text-[10px] text-slate-500">
          {tdLocationSentence(m.td_grade)}
        </p>
      ) : null}
    </article>
  );
}
