/**
 * Maintenance history client.
 * Demo / Pages: local JSON + sessionStorage overlays.
 * Online: FastAPI endpoints.
 * Similarity logic mirrors backend weighted scoring (swapable).
 *
 * PROTOTYPE DEMO DATA — not real military records.
 */

import seed from "../data/maintenanceHistory.json";
import type { DiagnosisResult } from "../types/diagnosis";
import type {
  AircraftInfo,
  MaintenanceHistoryCreate,
  MaintenanceHistoryFilters,
  MaintenanceHistoryRecord,
  MaintenanceHistoryStats,
  SimilarMaintenanceItem,
} from "../types/maintenance";
import { api } from "./queryService";

const LOCAL_KEY = "mh_user_records_v1";

type Seed = {
  aircraft: AircraftInfo[];
  records: MaintenanceHistoryRecord[];
};

const rawSeed = seed as Seed & { default?: Seed };
const seedData: Seed = {
  aircraft: rawSeed.aircraft ?? rawSeed.default?.aircraft ?? [],
  records: rawSeed.records ?? rawSeed.default?.records ?? [],
};

if (typeof console !== "undefined" && seedData.records.length) {
  // One-time load signal for Demo/Pages debugging
  // eslint-disable-next-line no-console
  console.info(
    `[MaintenanceHistory] loaded records: ${seedData.records.length} (v${(seed as { version?: string }).version ?? "?"})`,
  );
}

function canonicalAircraftId(id: string): string {
  return id === "DEMO-KUH-01" ? "AC-001" : id;
}

function loadUserRecords(): MaintenanceHistoryRecord[] {
  try {
    const raw = sessionStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MaintenanceHistoryRecord[];
  } catch {
    return [];
  }
}

function saveUserRecords(rows: MaintenanceHistoryRecord[]) {
  sessionStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
}

function allLocalRecords(): MaintenanceHistoryRecord[] {
  return [...seedData.records, ...loadUserRecords()];
}

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[\s,./·\-_/?]+/)
      .filter((t) => t.length >= 2),
  );
}

export function scoreSimilarityLocal(
  query: Record<string, string | undefined | null>,
  record: MaintenanceHistoryRecord,
): number {
  let score = 0;
  let wSum = 0;
  const add = (w: number, hit: boolean, partial = 0) => {
    wSum += w;
    score += w * (hit ? 1 : partial);
  };
  const qScode = (query.symptom_code || "").toUpperCase();
  const qSys = (query.system_code || "").toUpperCase();
  const qFault = (query.fault_code || "").toUpperCase();
  add(0.28, !!qScode && qScode === (record.symptom_code || "").toUpperCase());
  add(0.18, !!qSys && qSys === (record.system_code || "").toUpperCase());
  add(
    0.12,
    !!qFault && (record.fault_code || "").toUpperCase().includes(qFault),
  );
  const qt = tokens(
    `${query.symptom || ""} ${query.diagnosis || ""} ${query.component || ""}`,
  );
  const rt = tokens(
    `${record.symptom} ${record.diagnosis} ${record.root_cause} ${record.component} ${record.maintenance_action}`,
  );
  if (qt.size && rt.size) {
    let inter = 0;
    qt.forEach((t) => {
      if (rt.has(t)) inter += 1;
    });
    const union = qt.size + rt.size - inter;
    add(0.32, false, inter / Math.max(union, 1));
  } else add(0.32, false, 0);

  const nq = /([\d.]+)\s*psi/i.exec(query.detected_value || "");
  const nr = /([\d.]+)\s*psi/i.exec(record.detected_value || "");
  if (nq && nr) {
    const diff = Math.abs(parseFloat(nq[1]) - parseFloat(nr[1]));
    add(0.1, false, Math.max(0, 1 - diff / 40));
  } else add(0.1, false, 0);

  return wSum ? score / wSum : 0;
}

export function listAircraftLocal(): AircraftInfo[] {
  return seedData.aircraft.filter((a) => !a.alias_of);
}

export function getAircraftLocal(aircraftId: string): AircraftInfo | null {
  const aid = canonicalAircraftId(aircraftId);
  const base =
    seedData.aircraft.find((a) => a.aircraft_id === aid && !a.alias_of) ??
    seedData.aircraft.find((a) => a.aircraft_id === aid) ??
    null;
  if (!base) return null;
  const count = allLocalRecords().filter((r) => r.aircraft_id === aid).length;
  return { ...base, maintenance_count: count };
}

export function listHistoryLocal(
  filters: MaintenanceHistoryFilters = {},
): MaintenanceHistoryRecord[] {
  let rows = allLocalRecords();
  const aid = filters.aircraft_id
    ? canonicalAircraftId(filters.aircraft_id)
    : null;
  if (aid) rows = rows.filter((r) => r.aircraft_id === aid);
  if (filters.system_category)
    rows = rows.filter((r) =>
      r.system_category.includes(filters.system_category!),
    );
  if (filters.component)
    rows = rows.filter((r) => r.component.includes(filters.component!));
  if (filters.fault_code)
    rows = rows.filter((r) => r.fault_code.includes(filters.fault_code!));
  if (filters.symptom) {
    const q = filters.symptom;
    rows = rows.filter(
      (r) =>
        r.symptom.includes(q) ||
        r.diagnosis.includes(q) ||
        r.root_cause.includes(q),
    );
  }
  if (filters.maintenance_result)
    rows = rows.filter((r) =>
      r.maintenance_result.includes(filters.maintenance_result!),
    );
  if (filters.severity)
    rows = rows.filter((r) => r.severity === filters.severity);
  if (filters.date_from)
    rows = rows.filter((r) => r.maintenance_date >= filters.date_from!);
  if (filters.date_to)
    rows = rows.filter((r) => r.maintenance_date <= filters.date_to!);
  return rows.sort((a, b) =>
    b.maintenance_date.localeCompare(a.maintenance_date),
  );
}

export function searchSimilarLocal(
  query: {
    aircraft_id?: string;
    symptom_code?: string;
    system_code?: string;
    fault_code?: string;
    symptom?: string;
    diagnosis?: string;
    component?: string;
    detected_value?: string;
  },
  topK = 5,
): SimilarMaintenanceItem[] {
  // Prefer same-aircraft pool; if too few same-code hits, expand fleet (demo UX)
  let rows = listHistoryLocal(
    query.aircraft_id ? { aircraft_id: query.aircraft_id } : {},
  );
  if (query.aircraft_id && rows.length < 3) {
    rows = listHistoryLocal({});
  } else if (query.aircraft_id && query.symptom_code) {
    const sameCode = rows.filter(
      (r) =>
        (r.symptom_code || "").toUpperCase() ===
        (query.symptom_code || "").toUpperCase(),
    );
    if (sameCode.length < 5) {
      rows = listHistoryLocal({});
    }
  }
  const scored = rows
    .map((record) => {
      let s = scoreSimilarityLocal(query, record);
      if (
        query.aircraft_id &&
        record.aircraft_id === canonicalAircraftId(query.aircraft_id)
      ) {
        s = Math.min(1, s + 0.05);
      }
      return {
        record,
        similarity: Math.round(s * 10000) / 10000,
        similarity_percent: Math.round(s * 100),
      };
    })
    .filter((x) => x.similarity >= 0.15)
    .sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topK);
}

export function statsLocal(
  aircraftId?: string,
): MaintenanceHistoryStats {
  const rows = listHistoryLocal(
    aircraftId ? { aircraft_id: aircraftId } : {},
  );
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cut = cutoff.toISOString().slice(0, 10);
  const by_system: Record<string, number> = {};
  const faultCounts: Record<string, number> = {};
  for (const r of rows) {
    by_system[r.system_category] = (by_system[r.system_category] || 0) + 1;
    const k = r.symptom || r.fault_code;
    faultCounts[k] = (faultCounts[k] || 0) + 1;
  }
  const top = Object.entries(faultCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([symptom, count]) => ({ symptom, count }));
  return {
    total: rows.length,
    last_30_days: rows.filter((r) => r.maintenance_date >= cut).length,
    by_system,
    top_faults: top,
    recurrence_count: rows.filter((r) => r.recurrence).length,
    recent: rows.slice(0, 5),
  };
}

export function createHistoryLocal(
  body: MaintenanceHistoryCreate,
): MaintenanceHistoryRecord {
  const aid = canonicalAircraftId(body.aircraft_id);
  const ac = getAircraftLocal(aid);
  const id = `MNT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const today = new Date().toISOString().slice(0, 10);
  const record: MaintenanceHistoryRecord = {
    maintenance_id: id,
    aircraft_id: aid,
    maintenance_date: body.maintenance_date || today,
    flight_hours: body.flight_hours ?? ac?.total_flight_hours ?? 0,
    fault_code: body.fault_code || "USER-REG",
    system_category: body.system_category || "Engine Oil System",
    component: body.component || "—",
    symptom: body.symptom,
    detected_value: body.detected_value,
    normal_range: body.normal_range,
    severity: body.severity || "Warning",
    diagnosis: body.diagnosis || body.symptom,
    root_cause: body.root_cause,
    maintenance_action: body.maintenance_action,
    replaced_part: body.replaced_part,
    technician_note: body.technician_note,
    maintenance_result: body.maintenance_result,
    recurrence: body.recurrence || false,
    reference_manual: body.reference_manual,
    symptom_code: body.symptom_code,
    system_code: body.system_code,
    created_at: new Date().toISOString(),
    is_dummy: false,
  };
  const next = [...loadUserRecords(), record];
  saveUserRecords(next);
  return record;
}

/** Prefer API; fall back to local for Demo/Pages. */
export async function fetchAircraftList(): Promise<AircraftInfo[]> {
  try {
    const { data } = await api.get<{ items: AircraftInfo[] }>("/api/aircraft");
    if (data.items?.length) return data.items;
  } catch {
    /* local */
  }
  return listAircraftLocal();
}

export async function fetchAircraft(
  aircraftId: string,
): Promise<AircraftInfo | null> {
  try {
    const { data } = await api.get<AircraftInfo>(`/api/aircraft/${aircraftId}`);
    return data;
  } catch {
    return getAircraftLocal(aircraftId);
  }
}

export async function fetchMaintenanceHistory(
  filters: MaintenanceHistoryFilters = {},
): Promise<MaintenanceHistoryRecord[]> {
  try {
    const { data } = await api.get<{ items: MaintenanceHistoryRecord[] }>(
      "/api/maintenance-history",
      { params: filters },
    );
    return data.items ?? [];
  } catch {
    return listHistoryLocal(filters);
  }
}

export async function fetchMaintenanceStats(
  aircraftId?: string,
): Promise<MaintenanceHistoryStats> {
  try {
    const { data } = await api.get<MaintenanceHistoryStats>(
      "/api/maintenance-history/stats",
      { params: { aircraft_id: aircraftId } },
    );
    return data;
  } catch {
    return statsLocal(aircraftId);
  }
}

export async function fetchSimilarMaintenance(params: {
  aircraft_id?: string;
  symptom_code?: string;
  system_code?: string;
  fault_code?: string;
  symptom?: string;
  diagnosis?: string;
  component?: string;
  detected_value?: string;
  top_k?: number;
}): Promise<SimilarMaintenanceItem[]> {
  const local = searchSimilarLocal(params, params.top_k ?? 7);
  try {
    const { data } = await api.get<{ items: SimilarMaintenanceItem[] }>(
      "/api/maintenance-history/similar",
      { params },
    );
    if (data.items?.length) return data.items;
  } catch {
    /* local */
  }
  return local;
}

export async function postMaintenanceHistory(
  body: MaintenanceHistoryCreate,
): Promise<MaintenanceHistoryRecord> {
  try {
    const { data } = await api.post<MaintenanceHistoryRecord>(
      "/api/maintenance-history",
      body,
    );
    return data;
  } catch {
    return createHistoryLocal(body);
  }
}

export function similarQueryFromDiagnosis(
  result: DiagnosisResult,
  aircraftId: string,
): Parameters<typeof fetchSimilarMaintenance>[0] {
  // Map diagnosis symptom → maintenance history codes.
  // Do NOT use 3D mesh / FAULT_AREA* IDs as maintenance fault codes.
  const symptomCode = result.symptom_code;
  const historyFault =
    symptomCode === "ENG_OIL_PRESS_LOW"
      ? "ENG-OIL-P-01"
      : symptomCode === "HYD_PRESS_LOW"
        ? "HYD-P-01"
        : symptomCode === "GEN_OFF"
          ? "GEN-OFF-01"
          : result.fault_code && !result.fault_code.startsWith("FAULT_")
            ? result.fault_code
            : undefined;

  const detected =
    result.symptom_code.includes("OIL") || result.system_code === "ENGINE_OIL"
      ? "31 PSI"
      : result.system_code === "HYDRAULIC"
        ? "1800 PSI"
        : result.system_code === "ELECTRICAL"
          ? "22.4 V"
          : undefined;

  return {
    aircraft_id: aircraftId,
    symptom_code: symptomCode,
    system_code: result.system_code,
    fault_code: historyFault,
    // Prefer Korean symptom phrases over long answer text for token match
    symptom:
      symptomCode === "ENG_OIL_PRESS_LOW"
        ? "엔진오일 압력 저하"
        : symptomCode === "HYD_PRESS_LOW"
          ? "유압 압력 저하"
          : symptomCode === "GEN_OFF"
            ? "발전기 출력 이상"
            : result.answer?.slice(0, 80),
    diagnosis: result.answer?.slice(0, 80),
    // Do not pass 3D component mesh names (PRESSURE_SENSOR etc.) as history component
    component: undefined,
    detected_value: detected,
    top_k: 7,
  };
}

export function buildHistoryInsight(
  similar: SimilarMaintenanceItem[],
  diagnosis?: DiagnosisResult | null,
): string | null {
  if (!similar.length) return null;
  const top = similar[0];
  const filterish = similar.filter(
    (s) =>
      /필터|filter/i.test(s.record.root_cause) ||
      /필터|filter/i.test(s.record.maintenance_action),
  );
  const n = similar.length;
  const filterN = filterish.length;
  const parts: string[] = [];
  if (diagnosis?.system_code === "ENGINE_OIL") {
    parts.push(
      "현재 엔진오일 압력은 정상범위보다 낮은 상태입니다(31 PSI / 정상 45~65 PSI).",
    );
  } else if (diagnosis?.system_code === "HYDRAULIC") {
    parts.push("현재 유압 압력 지시가 정상 범위를 벗어난 것으로 분석되었습니다.");
  } else if (diagnosis?.system_code === "ELECTRICAL") {
    parts.push("현재 발전기·전기계통 이상이 발생한 것으로 분석되었습니다.");
  }
  const tm = diagnosis?.sources?.[0];
  if (tm) {
    parts.push(
      `기술교범(${tm.manual_id}${tm.task ? ` / Task ${tm.task}` : ""})에 따른 점검·정비절차를 우선 적용하십시오.`,
    );
  } else {
    parts.push("기술교범에 따른 점검·정비절차를 우선 적용하십시오.");
  }
  if (filterN >= 2) {
    parts.push(
      `과거 유사사례 ${n}건 중 ${filterN}건에서 ` +
        `${filterish[0].record.root_cause}이(가) 원인으로 확인되었으며, ` +
        `${filterish[0].record.maintenance_action} 후 ${filterish[0].record.maintenance_result} 사례가 있습니다.`,
    );
  } else {
    parts.push(
      `과거 유사사례 ${n}건이 있으며, 가장 유사한 사례(${top.similarity_percent}%)에서는 ` +
        `원인「${top.record.root_cause}」, 조치「${top.record.maintenance_action}」, ` +
        `결과「${top.record.maintenance_result}」이었습니다.`,
    );
  }
  parts.push("정비이력은 참고정보이며, 기술교범이 공식 정비근거입니다.");
  return parts.join(" ");
}
