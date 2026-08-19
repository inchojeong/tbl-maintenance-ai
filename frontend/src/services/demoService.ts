import demoResponses from "../data/demoResponses.json";
import type { DiagnosisResult } from "../types/diagnosis";

const AREA01_EXTRA: Partial<DiagnosisResult> = {
  fault_code: "FAULT_AREA01_PART01",
  area_id: "AREA_01",
  target_mesh: "AREA_01_PART_01",
  cover_mesh: "AREA_01_COVER_01",
  inspection_point: "AREA_01_CHECK_01",
};

const UNKNOWN: DiagnosisResult = {
  system_code: "UNKNOWN",
  symptom_code: "UNKNOWN",
  risk_level: "LOW",
  suspected_components: ["UNKNOWN"],
  answer:
    "관련 공개 교범 시나리오를 찾지 못했습니다. 증상을 더 구체적으로 입력하거나 데모 질의 예시를 사용해 주세요.",
  manual_ids: [],
  recommended_steps: ["증상 재입력", "데모 질의 예시 사용"],
  view_target_id: "AIRCRAFT_OVERVIEW",
  confidence: 0.2,
  is_demo: true,
  sources: [],
};

function bestMatch(query: string) {
  let best: (typeof demoResponses.responses)[number] | null = null;
  let bestLen = 0;
  for (const item of demoResponses.responses) {
    const keys = [
      ...item.keywords,
      ...((item as { keywords_alt?: string[] }).keywords_alt ?? []),
    ];
    for (const k of keys) {
      if (query.includes(k) && k.length > bestLen) {
        best = item;
        bestLen = k.length;
      }
    }
  }
  return best;
}

export function matchDemoResponse(query: string): DiagnosisResult {
  const q = query.trim();
  const item = bestMatch(q);
  if (item) {
    const base = { ...item.response, is_demo: true } as DiagnosisResult;
    if (base.system_code === "ENGINE_OIL") {
      return { ...base, ...AREA01_EXTRA };
    }
    return base;
  }

  if (q.includes("오일") && (q.includes("압력") || q.includes("경고"))) {
    const oil = demoResponses.responses.find(
      (r) => r.id === "DEMO-PUB-ENG-OIL-001",
    )?.response;
    if (oil) {
      return {
        ...(oil as DiagnosisResult),
        is_demo: true,
        ...AREA01_EXTRA,
      };
    }
  }

  return { ...UNKNOWN };
}
