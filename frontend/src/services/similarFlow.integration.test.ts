import { describe, it, expect } from "vitest";
import { matchDemoResponse } from "./demoService";
import { similarQueryFromDiagnosis, searchSimilarLocal, listHistoryLocal } from "./maintenanceHistoryService";

describe("end-to-end similar flow (demo)", () => {
  it("loads 64 seed records", () => {
    expect(listHistoryLocal({}).length).toBeGreaterThanOrEqual(60);
  });
  it.each([
    "엔진오일 압력이 31 PSI로 떨어졌습니다",
    "유압 압력이 정상보다 낮습니다",
    "발전기 출력 이상이 발생했습니다",
  ])("query %s yields >=5 similar", (q) => {
    const d = matchDemoResponse(q);
    expect(d.symptom_code).not.toBe("UNKNOWN");
    const sq = similarQueryFromDiagnosis(d, "AC-001");
    const items = searchSimilarLocal(sq, 7);
    expect(items.length).toBeGreaterThanOrEqual(5);
  });
});
