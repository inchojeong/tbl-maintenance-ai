import { describe, expect, it } from "vitest";
import {
  isBundledManualPdf,
  manualPageImageUrl,
  manualPdfUrl,
} from "./manualAssets";
import { matchDemoResponse } from "./demoService";
import publicManualChunks from "../data/publicManualChunks.json";

describe("manualAssets", () => {
  it("builds page image and PDF URLs with public base", () => {
    expect(isBundledManualPdf("TM_55-1520-240-T-2.pdf")).toBe(true);
    expect(isBundledManualPdf("TM_55-1520-240-T-1.pdf")).toBe(false);
    expect(manualPageImageUrl("manual-pages/T2_p114.webp")).toMatch(
      /manual-pages\/T2_p114\.webp$/,
    );
    expect(manualPdfUrl("TM_55-1520-240-T-2.pdf", 114)).toMatch(
      /manuals\/TM_55-1520-240-T-2\.pdf#page=114$/,
    );
    expect(manualPdfUrl("TM_55-1520-240-T-1.pdf", 10)).toBeNull();
  });
});

describe("validated demo manual pages", () => {
  const chunks = (
    publicManualChunks as {
      chunks: Array<{
        id: string;
        pdf_page?: number;
        page_image?: string;
        task?: string;
      }>;
    }
  ).chunks;

  it("engine oil maps to validated T-2 p.114 image", () => {
    const r = matchDemoResponse("엔진오일 압력이 31 PSI로 떨어졌습니다");
    expect(r.manual_ids).toContain("CH47-TM-T2-ENG-OIL-001");
    expect(r.sources?.[0]?.pdf_page).toBe(114);
    const c = chunks.find((x) => x.id === "CH47-TM-T2-ENG-OIL-001");
    expect(c?.pdf_page).toBe(114);
    expect(c?.page_image).toBe("manual-pages/T2_p114.webp");
    expect(c?.task).toBe("8-3.3");
  });

  it("hydraulic maps to validated T-2 p.227 image", () => {
    const r = matchDemoResponse("유압 압력이 정상보다 낮습니다");
    expect(r.manual_ids).toContain("CH47-TM-T2-HYD-PRESS-001");
    expect(r.sources?.[0]?.pdf_page).toBe(227);
    const c = chunks.find((x) => x.id === "CH47-TM-T2-HYD-PRESS-001");
    expect(c?.pdf_page).toBe(227);
    expect(c?.page_image).toBe("manual-pages/T2_p227.webp");
  });

  it("generator maps to validated Task 9-2.4 body at T-2 p.586", () => {
    const r = matchDemoResponse("발전기 출력 이상이 발생했습니다");
    expect(r.manual_ids).toContain("CH47-TM-T2-GEN-001");
    expect(r.sources?.[0]?.pdf_page).toBe(586);
    expect(r.sources?.[0]?.task).toBe("9-2.4");
    const c = chunks.find((x) => x.id === "CH47-TM-T2-GEN-001");
    expect(c?.pdf_page).toBe(586);
    expect(c?.page_image).toBe("manual-pages/T2_p586.webp");
  });
});
