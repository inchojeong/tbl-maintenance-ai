export type AreaId = "AREA_01" | "AREA_02" | "AREA_03" | "AREA_04";

export type AreaLoadStatus = "idle" | "loading" | "ready" | "error" | "proxy";

export interface FaultMeshEntry {
  fault_code: string;
  label_ko: string;
  area_id: AreaId;
  model: string;
  target_mesh: string;
  cover_mesh: string;
  inspection_point: string;
  default_view_target: string;
  component_focus_view: string;
  system_code: string;
  legacy_aliases: string[];
  legacy_mesh_map?: Record<string, string>;
}

export interface MaintenanceAreaConfig {
  area_id: AreaId;
  label_ko: string;
  hotspotMesh: string;
  model: string;
  defaultViewTarget: string;
  legacyHotspot?: string;
  enabled: boolean;
}

export interface ResolvedFault {
  fault: FaultMeshEntry;
  area: MaintenanceAreaConfig;
  /** Meshes to highlight in current scene (includes legacy proxy names). */
  highlightMeshes: string[];
  /** Cover meshes including legacy aliases. */
  coverMeshes: string[];
  viewTargetId: string;
  modelUrl: string;
}
