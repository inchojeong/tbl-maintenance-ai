import { Line } from "@react-three/drei";

/** Optional approach path arrow for P1 demos. */
export function MaintenancePath({ visible = false }: { visible?: boolean }) {
  if (!visible) return null;
  return (
    <Line
      points={[
        [2.5, 0.2, 2.5],
        [1.5, 0.8, 1.2],
        [0.9, 1.5, 0.5],
      ]}
      color="#38bdf8"
      lineWidth={2}
      dashed={false}
    />
  );
}
