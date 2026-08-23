import type {
  InspectionAssembly,
  InspectionLevel,
} from "../../types/diagnosis";

/** Map view-target id → drill-down level + assembly/part hints. */
export function inspectionStateFromViewTarget(id: string): {
  inspectionLevel: InspectionLevel;
  selectedAssembly: InspectionAssembly;
  selectedMaintenancePart: string | null;
} {
  if (id === "AIRCRAFT_OVERVIEW" || id === "ENGINE_ZONE_GUIDE") {
    return {
      inspectionLevel: "EXTERIOR",
      selectedAssembly: null,
      selectedMaintenancePart: null,
    };
  }

  if (
    id === "ENGINE_SYSTEM" ||
    id === "ENGINE_OVERVIEW" ||
    id === "ENGINE_OIL_SYSTEM"
  ) {
    return {
      inspectionLevel: "SYSTEM",
      selectedAssembly: null,
      selectedMaintenancePart: null,
    };
  }

  if (
    id === "ENGINE_LEFT_ASSEMBLY" ||
    id === "ENGINE_INTERNAL_VIEW" ||
    id === "ENGINE_OIL_INTERNAL" ||
    id === "ENGINE_ACCESS_PANEL"
  ) {
    return {
      inspectionLevel: "ASSEMBLY",
      selectedAssembly: "ENGINE_LEFT",
      selectedMaintenancePart: null,
    };
  }

  if (id === "ENGINE_PRESSURE_SENSOR" || id === "ENGINE_OIL_SENSOR") {
    return {
      inspectionLevel: "COMPONENT",
      selectedAssembly: "ENGINE_LEFT",
      selectedMaintenancePart: "PRESSURE_SENSOR",
    };
  }
  if (id === "ENGINE_OIL_FILTER") {
    return {
      inspectionLevel: "COMPONENT",
      selectedAssembly: "ENGINE_LEFT",
      selectedMaintenancePart: "OIL_FILTER",
    };
  }
  if (id === "ENGINE_OIL_PUMP") {
    return {
      inspectionLevel: "COMPONENT",
      selectedAssembly: "ENGINE_LEFT",
      selectedMaintenancePart: "OIL_PUMP",
    };
  }

  // —— Generator ——
  if (
    id === "GENERATOR_OVERVIEW" ||
    id === "ELECTRICAL_SYSTEM"
  ) {
    return {
      inspectionLevel: "SYSTEM",
      selectedAssembly: null,
      selectedMaintenancePart: null,
    };
  }
  if (id === "GENERATOR_ASSEMBLY") {
    return {
      inspectionLevel: "ASSEMBLY",
      selectedAssembly: "GENERATOR_ASSEMBLY",
      selectedMaintenancePart: null,
    };
  }
  if (id === "GENERATOR_DETAIL") {
    return {
      inspectionLevel: "COMPONENT",
      selectedAssembly: "GENERATOR_ASSEMBLY",
      selectedMaintenancePart: "GENERATOR",
    };
  }
  if (id === "GENERATOR_CONTROL") {
    return {
      inspectionLevel: "COMPONENT",
      selectedAssembly: "GENERATOR_ASSEMBLY",
      selectedMaintenancePart: "GENERATOR_CONTROL",
    };
  }
  if (id === "GENERATOR_WIRING") {
    return {
      inspectionLevel: "COMPONENT",
      selectedAssembly: "GENERATOR_ASSEMBLY",
      selectedMaintenancePart: "GENERATOR_WIRING",
    };
  }

  // —— Hydraulic ——
  if (id === "HYDRAULIC_OVERVIEW" || id === "HYDRAULIC_SYSTEM") {
    return {
      inspectionLevel: "SYSTEM",
      selectedAssembly: null,
      selectedMaintenancePart: null,
    };
  }
  if (id === "HYDRAULIC_ASSEMBLY") {
    return {
      inspectionLevel: "ASSEMBLY",
      selectedAssembly: "HYDRAULIC_ASSEMBLY",
      selectedMaintenancePart: null,
    };
  }
  if (id === "HYDRAULIC_PUMP") {
    return {
      inspectionLevel: "COMPONENT",
      selectedAssembly: "HYDRAULIC_ASSEMBLY",
      selectedMaintenancePart: "HYDRAULIC_PUMP",
    };
  }
  if (id === "HYDRAULIC_SENSOR") {
    return {
      inspectionLevel: "COMPONENT",
      selectedAssembly: "HYDRAULIC_ASSEMBLY",
      selectedMaintenancePart: "HYDRAULIC_SENSOR",
    };
  }
  if (id === "HYDRAULIC_LINE") {
    return {
      inspectionLevel: "COMPONENT",
      selectedAssembly: "HYDRAULIC_ASSEMBLY",
      selectedMaintenancePart: "HYDRAULIC_LINE",
    };
  }

  return {
    inspectionLevel: "SYSTEM",
    selectedAssembly: null,
    selectedMaintenancePart: null,
  };
}
