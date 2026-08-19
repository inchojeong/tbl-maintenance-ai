import { Html } from "@react-three/drei";

export function ObjectLabel({
  position,
  title,
  subtitle,
}: {
  position: [number, number, number];
  title: string;
  subtitle?: string;
}) {
  return (
    <Html position={position} center distanceFactor={10} style={{ pointerEvents: "none" }}>
      <div className="rounded border border-red-400/80 bg-slate-950/85 px-2 py-1 text-[11px] text-white shadow-lg whitespace-nowrap">
        <div className="font-semibold text-red-300">{title}</div>
        {subtitle ? <div className="text-slate-300">{subtitle}</div> : null}
      </div>
    </Html>
  );
}
