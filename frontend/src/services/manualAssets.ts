import { publicUrl } from "../utils/publicUrl";

/** Demo PDFs present under frontend/public/manuals/ (tracked for Pages). */
export const BUNDLED_MANUAL_PDFS = new Set(["TM_55-1520-240-T-2.pdf"]);

export function isBundledManualPdf(pdfFile?: string | null): boolean {
  if (!pdfFile) return false;
  return BUNDLED_MANUAL_PDFS.has(pdfFile);
}

export function manualPageImageUrl(pageImage?: string | null): string | null {
  if (!pageImage) return null;
  return publicUrl(pageImage);
}

/** Open bundled PDF at 1-based page (Chrome `#page=`). */
export function manualPdfUrl(
  pdfFile?: string | null,
  pdfPage?: number | null,
): string | null {
  if (!pdfFile || !isBundledManualPdf(pdfFile)) return null;
  const base = publicUrl(`manuals/${pdfFile}`);
  if (pdfPage != null && pdfPage > 0) return `${base}#page=${pdfPage}`;
  return base;
}
