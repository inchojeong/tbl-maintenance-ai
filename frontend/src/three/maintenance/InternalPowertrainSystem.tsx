import { useAppStore } from "../../stores/useAppStore";
import { EngineSystemModel } from "./EngineSystemModel";
import { DriveSystemModel } from "./DriveSystemModel";
import { MainGearboxModel } from "./MainGearboxModel";
import { RotorMastModel } from "./RotorMastModel";

type SystemProps = {
  selectedIds: Set<string>;
  hiddenIds: Set<string>;
  transparentIds: Set<string>;
  onObjectClick: (id: string) => void;
  dimNonSelected?: boolean;
};

/**
 * Connected internal powertrain for ENGINE_OIL cutaway:
 * Engines → output shafts → main gearbox → rotor mast.
 *
 * Internal engine, drivetrain, gearbox and rotor-mast geometry is an
 * illustrative prototype visualization and is not an exact reproduction
 * of the UH-60 internal configuration.
 */
export function InternalPowertrainSystem(props: SystemProps) {
  const level = useAppStore((s) => s.inspectionLevel);
  if (level === "EXTERIOR") return null;

  const driveOpacity =
    level === "COMPONENT" ? 0.28 : level === "ASSEMBLY" ? 0.3 : 1;
  const gearboxOpacity =
    level === "COMPONENT" ? 0.26 : level === "ASSEMBLY" ? 0.3 : 1;
  const mastOpacity =
    level === "COMPONENT" ? 0.22 : level === "ASSEMBLY" ? 0.25 : 1;

  return (
    <group name="INTERNAL_POWERTRAIN">
      <EngineSystemModel {...props} />
      <DriveSystemModel opacity={driveOpacity} />
      <MainGearboxModel opacity={gearboxOpacity} />
      <RotorMastModel opacity={mastOpacity} />
    </group>
  );
}
