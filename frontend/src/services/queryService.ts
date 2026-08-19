import axios from "axios";
import type {
  DiagnosisResult,
  FailureCase,
  ManualChunk,
  PhmStatus,
  ViewTargetConfig,
} from "../types/diagnosis";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

export async function postQuery(body: {
  aircraft_id: string;
  query: string;
  demo_mode?: boolean;
}): Promise<DiagnosisResult> {
  const { data } = await api.post<DiagnosisResult>("/api/query", body);
  return data;
}

export async function fetchManuals(
  systemCode?: string,
  q = "오일",
): Promise<ManualChunk[]> {
  const { data } = await api.get<{ items: ManualChunk[] }>(
    "/api/manual/search",
    { params: { q, system_code: systemCode, top_k: 5 } },
  );
  return data.items;
}

export async function fetchFailures(
  symptomCode?: string,
): Promise<FailureCase[]> {
  const { data } = await api.get<{ items: FailureCase[] }>(
    "/api/failures/search",
    { params: { symptom_code: symptomCode, top_k: 5 } },
  );
  return data.items;
}

export async function fetchPhm(aircraftId: string): Promise<PhmStatus> {
  const { data } = await api.get<PhmStatus>(`/api/phm/${aircraftId}`);
  return data;
}

export async function fetchViewMap(
  viewTargetId: string,
): Promise<ViewTargetConfig> {
  const { data } = await api.get<ViewTargetConfig>(
    `/api/3d/map/${viewTargetId}`,
  );
  return data;
}

export async function postMaintenanceResult(body: {
  aircraft_id: string;
  actions: string;
  parts_used?: string;
  outcome: string;
}): Promise<{ id: string; saved: boolean }> {
  const { data } = await api.post("/api/maintenance/result", body);
  return data;
}

export async function postDemoReset(aircraftId: string) {
  const { data } = await api.post("/api/demo/reset", {
    aircraft_id: aircraftId,
  });
  return data;
}

export async function healthCheck(): Promise<boolean> {
  try {
    await api.get("/api/health");
    return true;
  } catch {
    return false;
  }
}
