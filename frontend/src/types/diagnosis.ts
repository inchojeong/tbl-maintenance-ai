export type ViewLevel = "AIRCRAFT" | "SYSTEM" | "COMPONENT";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type SystemCode =
  | "ENGINE_OIL"
  | "ENGINE_COOLING"
  | "LANDING_GEAR"
  | "MAIN_ROTOR"
  | "HYDRAULIC"
  | "ELECTRICAL"
  | "DRIVE_SYSTEM"
  | "FUEL"
  | "UNKNOWN";
export type ComponentCode =
  | "OIL_FILTER"
  | "OIL_PUMP"
  | "PRESSURE_SENSOR"
  | "ACCESS_PANEL"
  | "UNKNOWN";

export type BottomTab = "manual" | "failure" | "phm" | "guide" | "history";

export interface SourceRef {
  manual_id: string;
  document_id: string;
  title: string;
  /** Compat alias of pdf_page */
  page?: number;
  /** 1-based local PDF page index (not printed page) */
  pdf_page?: number | null;
  /** Task id e.g. 8-3.3 */
  task?: string | null;
  /** Legacy alias of task */
  paragraph?: string | null;
  /** Printed page only if verified; else null */
  printed_page?: number | null;
}

export interface DiagnosisResult {
  system_code: SystemCode;
  symptom_code: string;
  risk_level: RiskLevel;
  suspected_components: string[];
  answer: string;
  manual_ids: string[];
  recommended_steps: string[];
  view_target_id: string;
  confidence: number;
  is_demo: boolean;
  sources?: SourceRef[];
  /** Optional structured 3D linkage (AREA mapping). */
  fault_code?: string;
  area_id?: string;
  target_mesh?: string;
  cover_mesh?: string;
  inspection_point?: string;
  /** COMPONENT | SYSTEM | AREA | PENDING */
  td_grade?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  time: string;
}

export interface ViewTargetConfig {
  level: ViewLevel;
  label: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  highlightObjects: string[];
  hideObjects: string[];
  transparentObjects: string[];
  openPanels: string[];
  duration: number;
}

export interface ManualChunk {
  id: string;
  title: string;
  chapter: string;
  section: string;
  page: number;
  content: string;
  system_code: string;
  is_dummy: boolean;
  score?: number;
  document_id?: string;
  paragraph?: string | null;
  source_manual?: string | null;
  original_text?: string | null;
  symptom_ko?: string | null;
  symptom_en?: string | null;
  possible_causes?: string[];
  recommended_steps?: string[];
  component_codes?: string[];
  is_demo_public_tm?: boolean;
  td_mapping?: string | null;
  td_grade?: string | null;
}

export interface FailureCase {
  id: string;
  symptom: string;
  cause: string;
  actions: string;
  result: string;
  similarity: number;
  is_dummy: boolean;
}

export interface PhmStatus {
  aircraft_id: string;
  oil_pressure_psi: number;
  oil_temperature_c: number;
  filter_differential_pressure_psi: number;
  vibration_g: number;
  health_score: number;
  estimated_rul_fh?: number;
  sensors?: { label: string; value: string; status: string }[];
  is_dummy: boolean;
}

export interface GuideStep {
  n: number;
  title: string;
  detail: string;
  viewTargetId: string;
}

export interface MaintenanceResultItem {
  id: string;
  aircraft_id: string;
  actions: string;
  parts_used?: string;
  outcome: string;
  created_at: string;
}

export interface AircraftModelProps {
  selectedObjectIds: string[];
  hiddenObjectIds: string[];
  transparentObjectIds: string[];
  openedPanelIds: string[];
  onObjectClick: (objectId: string) => void;
}
