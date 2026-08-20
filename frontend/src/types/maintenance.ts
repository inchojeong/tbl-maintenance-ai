/**
 * Maintenance history types.
 * PROTOTYPE DEMO — fictional data, not real military / DELIIS records.
 */

export interface AircraftInfo {
  aircraft_id: string;
  aircraft_type: string;
  aircraft_number: string;
  total_flight_hours: number;
  display_name?: string | null;
  alias_of?: string | null;
  maintenance_count?: number;
}

export interface MaintenanceHistoryRecord {
  maintenance_id: string;
  aircraft_id: string;
  maintenance_date: string;
  flight_hours: number;
  fault_code: string;
  system_category: string;
  component: string;
  symptom: string;
  detected_value?: string | null;
  normal_range?: string | null;
  severity: string;
  diagnosis: string;
  root_cause: string;
  maintenance_action: string;
  replaced_part?: string | null;
  technician_note?: string | null;
  maintenance_result: string;
  recurrence: boolean;
  reference_manual?: string | null;
  symptom_code?: string | null;
  system_code?: string | null;
  created_at: string;
  is_dummy?: boolean;
}

export interface SimilarMaintenanceItem {
  record: MaintenanceHistoryRecord;
  similarity: number;
  similarity_percent: number;
}

export interface MaintenanceHistoryCreate {
  aircraft_id: string;
  maintenance_date?: string;
  flight_hours?: number;
  fault_code?: string;
  system_category?: string;
  component?: string;
  symptom: string;
  detected_value?: string;
  normal_range?: string;
  severity?: string;
  diagnosis?: string;
  root_cause: string;
  maintenance_action: string;
  replaced_part?: string;
  technician_note?: string;
  maintenance_result: string;
  recurrence?: boolean;
  reference_manual?: string;
  symptom_code?: string;
  system_code?: string;
}

export interface MaintenanceHistoryStats {
  total: number;
  last_30_days: number;
  by_system: Record<string, number>;
  top_faults: { symptom: string; count: number }[];
  recurrence_count: number;
  recent: MaintenanceHistoryRecord[];
}

export interface MaintenanceHistoryFilters {
  aircraft_id?: string;
  system_category?: string;
  component?: string;
  fault_code?: string;
  symptom?: string;
  maintenance_result?: string;
  severity?: string;
  date_from?: string;
  date_to?: string;
}
