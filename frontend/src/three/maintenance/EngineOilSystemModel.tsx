import { InternalPowertrainSystem } from "./InternalPowertrainSystem";

type SystemProps = {
  selectedIds: Set<string>;
  hiddenIds: Set<string>;
  transparentIds: Set<string>;
  onObjectClick: (id: string) => void;
  dimNonSelected?: boolean;
};

/**
 * ENGINE_OIL overlay entry — now a full internal powertrain
 * (engines + drive + gearbox + mast + oil on No.1).
 * Name kept for MaintenanceInternalOverlay compatibility.
 */
export function EngineOilSystemModel(props: SystemProps) {
  return <InternalPowertrainSystem {...props} />;
}
