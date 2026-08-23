/** User-facing labels for internal codes. Logic/IDs unchanged. */

const COMPONENT_LABELS: Record<string, string> = {
  PRESSURE_SENSOR: "오일 압력 센서",
  OIL_FILTER: "엔진 오일 필터",
  OIL_PUMP: "오일 펌프",
  OIL_PIPE_MAIN: "메인 오일 배관",
  ENGINE_BLOCK: "No.1 엔진",
  ACCESS_PANEL: "접근 패널",
  ENGINE_ZONE: "엔진 계통",
  HYDRAULIC_ZONE: "유압계통",
  HYDRAULIC_PUMP: "유압 펌프",
  HYDRAULIC_LINE: "유압 배관",
  HYDRAULIC_SENSOR: "유압 센서",
  ELECTRICAL_ZONE: "발전기·전기계통",
  GENERATOR: "발전기",
  GENERATOR_CONTROL: "발전기 제어·커넥터",
  GENERATOR_WIRING: "전기 배선",
  XMSN_ZONE: "변속기 계통",
  FUEL_ZONE: "연료계통",
  UNKNOWN: "관련 계통",
};

const SYSTEM_LABELS: Record<string, string> = {
  ENGINE_OIL: "엔진 오일계통",
  ENGINE_COOLING: "엔진 냉각계통",
  LANDING_GEAR: "랜딩기어",
  MAIN_ROTOR: "메인 로터",
  HYDRAULIC: "유압계통",
  ELECTRICAL: "전기계통",
  DRIVE_SYSTEM: "구동·변속기 계통",
  FUEL: "연료계통",
  TRANSMISSION: "변속기 계통",
  ROTOR: "로터계통",
  SENSOR: "센서계통",
  ENGINE: "엔진계통",
  UNKNOWN: "미분류 계통",
};

const RISK_LABELS: Record<string, string> = {
  HIGH: "높음",
  MEDIUM: "주의",
  LOW: "낮음",
};

const VIEW_TARGET_LABELS: Record<string, string> = {
  AIRCRAFT_OVERVIEW: "항공기 전체",
  ENGINE_ZONE_GUIDE: "엔진 위치 안내",
  ENGINE_SYSTEM: "엔진 계통",
  ENGINE_LEFT_ASSEMBLY: "No.1 엔진",
  ENGINE_OVERVIEW: "엔진 위치",
  ENGINE_OIL_SYSTEM: "엔진 오일계통",
  ENGINE_ACCESS_PANEL: "엔진 접근패널",
  ENGINE_INTERNAL_VIEW: "엔진 내부",
  ENGINE_OIL_INTERNAL: "엔진 오일계통 내부",
  ENGINE_OIL_FILTER: "오일 필터",
  ENGINE_OIL_PUMP: "오일 펌프",
  ENGINE_PRESSURE_SENSOR: "오일 압력 센서",
  ENGINE_OIL_SENSOR: "오일 압력 센서",
  HYDRAULIC_SYSTEM: "유압계통",
  HYDRAULIC_OVERVIEW: "유압계통",
  HYDRAULIC_PUMP: "유압 펌프",
  HYDRAULIC_SENSOR: "유압 센서",
  HYDRAULIC_LINE: "유압 배관",
  ELECTRICAL_SYSTEM: "전기계통",
  GENERATOR_OVERVIEW: "발전기 위치",
  GENERATOR_DETAIL: "발전기",
  GENERATOR_WIRING: "전기 배선",
  AREA_01_OVERVIEW: "엔진 정비구역",
  AREA_01_CLOSE: "엔진 정비구역 접근",
  AREA_01_INTERNAL: "엔진 정비구역 내부",
};

const AREA_LABELS: Record<string, string> = {
  AREA_01: "엔진 정비구역",
  AREA_02: "유압 정비구역",
  AREA_03: "전기 정비구역",
  AREA_04: "변속기 정비구역",
};

const VIEW_LEVEL_LABELS: Record<string, string> = {
  AIRCRAFT: "항공기",
  SYSTEM: "계통",
  COMPONENT: "부품",
  AREA: "정비구역",
};

const SYMPTOM_STATUS_LABELS: Record<string, string> = {
  ENG_OIL_PRESS_LOW: "압력 저하",
  HYD_PRESS_LOW: "압력 저하",
  GEN_OFF: "출력 이상",
  ENG_OIL_TEMP_ABNORMAL: "온도 이상",
  XMSN_OIL_HOT: "오일 온도 상승",
  XMSN_OIL_PRESS_LOW: "오일 압력 저하",
};

const MEASURED_VALUE: Record<string, { value: string; normal: string }> = {
  ENG_OIL_PRESS_LOW: { value: "31 PSI", normal: "45~65 PSI" },
  HYD_PRESS_LOW: { value: "1,800 PSI", normal: "2,500~3,500 PSI" },
  GEN_OFF: { value: "22.4 V", normal: "27~29 V" },
};

const CATEGORY_LABELS: Record<string, string> = {
  "Engine Oil System": "엔진 오일계통",
  "Hydraulic System": "유압계통",
  "Generator / Electrical System": "발전기·전기계통",
  "Electrical System": "전기계통",
  "Fuel System": "연료계통",
  Transmission: "변속기 계통",
  Rotor: "로터계통",
  Sensor: "센서계통",
  "Engine Temperature": "엔진 온도계통",
  Engine: "엔진계통",
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

export function labelCategory(raw: string): string {
  return CATEGORY_LABELS[raw] ?? raw;
}

export function labelComponents(codes: string[]): string[] {
  return codes.map(labelComponent);
}

export function labelViewTarget(id: string): string {
  return VIEW_TARGET_LABELS[id] ?? id.replace(/_/g, " ");
}

export function labelArea(id: string | null | undefined): string | null {
  if (!id) return null;
  return AREA_LABELS[id] ?? null;
}

export function labelViewLevel(level: string): string {
  return VIEW_LEVEL_LABELS[level] ?? level;
}

export function labelSymptomStatus(symptomCode: string): string {
  return SYMPTOM_STATUS_LABELS[symptomCode] ?? "이상 발생";
}

export function measuredForSymptom(
  symptomCode: string,
): { value: string; normal: string } | null {
  return MEASURED_VALUE[symptomCode] ?? null;
}

export function relatedEquipmentHeading(tdGrade?: string | null): string {
  if (tdGrade === "COMPONENT") return "관련 장비";
  return "관련 계통";
}

export function tdLocationSentence(tdGrade?: string | null): string {
  if (tdGrade === "COMPONENT") {
    return "3D 모델에서 점검 위치를 확인할 수 있습니다.";
  }
  if (tdGrade === "SYSTEM") {
    return "3D 모델에서 관련 계통 위치를 확인할 수 있습니다.";
  }
  if (tdGrade === "AREA") {
    return "3D 모델에서 관련 정비구역을 확인할 수 있습니다.";
  }
  if (tdGrade === "PENDING") {
    return "현재 3D 모델에서 해당 위치를 표시할 수 없습니다.";
  }
  return "3D 모델에서 점검 위치를 확인할 수 있습니다.";
}

/** Compact 3D viewer status line (no internal IDs). */
export function viewerStatusLine(opts: {
  viewLevel: string;
  viewTargetId: string;
  activeAreaId?: string | null;
}): string {
  const parts = [
    labelViewTarget(opts.viewTargetId),
    labelArea(opts.activeAreaId ?? undefined),
  ].filter(Boolean);
  return parts.join(" · ");
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

/** Soften chat answers for maintenance-support tone; strip DEMO footers. */
export function formatAssistantAnswerForDisplay(raw: string): string {
  let text = raw
    .replace(/\n*※[^\n]*/g, "")
    .replace(/\n*관련 장비\n[^\n]*/g, "")
    .replace(/\n*관련 계통\n[^\n]*/g, "")
    .replace(/\n*정비교범 근거\n[\s\S]*?(?=\n\n3D 위치|\n*$)/g, "")
    .replace(/\n*3D 위치\n[^\n]*/g, "")
    .replace(/확인하는 것이 좋습니다\./g, "우선 확인하십시오.")
    .replace(/확인해 보겠습니다\./g, "확인하십시오.")
    .replace(/가능성이 있습니다\./g, "주요 원인 후보입니다.")
    .replace(
      /관련 고장탐구 절차로 이어서 점검할 수 있습니다\./g,
      "이상이 지속되면 관련 고장탐구 절차를 수행하십시오.",
    )
    .replace(
      /관련 고장탐구 절차로 이어 점검합니다\./g,
      "이상이 지속되면 관련 고장탐구 절차를 수행하십시오.",
    )
    .replace(
      /관련 장비 위치를 3D 모델에 표시했습니다\./g,
      "3D 모델에서 점검 위치를 확인할 수 있습니다.",
    )
    .replace(
      /관련 계통의 위치를 3D 모델에 표시했습니다\./g,
      "3D 모델에서 점검 위치를 확인할 수 있습니다.",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Keep first ~4 sentences / short blocks for chat readability
  const blocks = text.split(/\n\n+/).filter(Boolean);
  if (blocks.length > 3) {
    text = blocks.slice(0, 3).join("\n\n");
  }
  return text;
}
