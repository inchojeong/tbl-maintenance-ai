/** User-facing labels for internal codes. Logic/IDs unchanged. */

const COMPONENT_LABELS: Record<string, string> = {
  PRESSURE_SENSOR: "오일 압력 센서(Pressure Transmitter)",
  OIL_FILTER: "오일 필터",
  OIL_PUMP: "오일 펌프",
  ACCESS_PANEL: "접근 패널",
  ENGINE_ZONE: "엔진 계통",
  HYDRAULIC_ZONE: "비행조종 유압계통",
  ELECTRICAL_ZONE: "발전기·전기계통",
  XMSN_ZONE: "변속기 계통",
  FUEL_ZONE: "연료계통",
  UNKNOWN: "관련 계통",
};

const SYSTEM_LABELS: Record<string, string> = {
  ENGINE_OIL: "엔진 오일계통",
  ENGINE_COOLING: "엔진 냉각계통",
  LANDING_GEAR: "랜딩기어",
  MAIN_ROTOR: "메인 로터",
  HYDRAULIC: "비행조종 유압계통",
  ELECTRICAL: "전기계통",
  DRIVE_SYSTEM: "구동·변속기 계통",
  FUEL: "연료계통",
  UNKNOWN: "미분류 계통",
};

const RISK_LABELS: Record<string, string> = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
};

const TD_GRADE_LABELS: Record<string, string> = {
  COMPONENT: "관련 장비 위치를 3D 모델에 표시했습니다.",
  SYSTEM: "관련 계통의 위치를 3D 모델에 표시했습니다.",
  AREA: "관련 장비가 위치한 영역을 3D 모델에 표시했습니다.",
  PENDING: "현재 3D 모델에서 해당 위치를 표시할 수 없습니다.",
};

export function labelComponent(code: string): string {
  return COMPONENT_LABELS[code] ?? code.replace(/_/g, " ");
}

export function labelSystem(code: string): string {
  return SYSTEM_LABELS[code] ?? code;
}

export function labelRisk(code: string): string {
  return RISK_LABELS[code] ?? code;
}

export function labelComponents(codes: string[]): string[] {
  return codes.map(labelComponent);
}

export function relatedEquipmentHeading(tdGrade?: string | null): string {
  if (tdGrade === "COMPONENT") return "관련 장비";
  return "관련 계통";
}

export function tdLocationSentence(tdGrade?: string | null): string {
  return (
    TD_GRADE_LABELS[tdGrade ?? ""] ??
    "관련 위치를 3D 모델에 표시했습니다."
  );
}

/** True if string looks like an internal code users should not see raw. */
export function looksLikeInternalId(value: string): boolean {
  return (
    /^[A-Z][A-Z0-9_]+$/.test(value) ||
    value.includes("_ZONE") ||
    value.startsWith("FAULT_") ||
    value.startsWith("AREA_")
  );
}
