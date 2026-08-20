import { describe, expect, it } from "vitest";
import {
  searchSimilarLocal,
  scoreSimilarityLocal,
  listHistoryLocal,
  createHistoryLocal,
} from "./maintenanceHistoryService";

describe("maintenanceHistoryService (local)", () => {
  it("has seeded oil history for AC-001", () => {
    const rows = listHistoryLocal({
      aircraft_id: "AC-001",
      symptom: "엔진오일",
    });
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it("finds similar oil pressure cases", () => {
    const items = searchSimilarLocal(
      {
        aircraft_id: "AC-001",
        symptom_code: "ENG_OIL_PRESS_LOW",
        system_code: "ENGINE_OIL",
        symptom: "엔진오일 압력 저하",
        detected_value: "31 PSI",
      },
      5,
    );
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items[0].similarity_percent).toBeGreaterThanOrEqual(50);
  });

  it("scores exact symptom_code higher", () => {
    const rows = listHistoryLocal({ aircraft_id: "AC-001" });
    const oil = rows.find((r) => r.symptom_code === "ENG_OIL_PRESS_LOW");
    expect(oil).toBeTruthy();
    const s = scoreSimilarityLocal(
      { symptom_code: "ENG_OIL_PRESS_LOW", system_code: "ENGINE_OIL" },
      oil!,
    );
    expect(s).toBeGreaterThan(0.4);
  });

  it("registers new history into local session store", () => {
    const created = createHistoryLocal({
      aircraft_id: "AC-001",
      symptom: "엔진오일 압력 저하 vitest",
      root_cause: "테스트 원인",
      maintenance_action: "테스트 조치",
      maintenance_result: "테스트 결과",
      symptom_code: "ENG_OIL_PRESS_LOW",
      system_code: "ENGINE_OIL",
    });
    const items = searchSimilarLocal(
      {
        aircraft_id: "AC-001",
        symptom_code: "ENG_OIL_PRESS_LOW",
        symptom: "vitest",
      },
      10,
    );
    expect(
      items.some((i) => i.record.maintenance_id === created.maintenance_id),
    ).toBe(true);
  });
});
