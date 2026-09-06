import { useLayoutEffect, useRef, useState } from "react";
import { useAnnotationStore } from "./annotationStore";
import { useAppStore } from "../stores/useAppStore";

const CARD_W = 136;
const RAIL = 10;
/** Cap horizontal leader run so lines do not cross the whole viewport */
const MAX_LEADER_X = 150;

/**
 * Screen-space side-rail callouts. Leader endpoints track projected 3D targets.
 */
export function CutawayAnnotationOverlay() {
  const specs = useAnnotationStore((s) => s.specs);
  const screens = useAnnotationStore((s) => s.screens);
  const selectObject = useAppStore((s) => s.selectObject);
  const level = useAppStore((s) => s.inspectionLevel);
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  const [h, setH] = useState(400);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setW(el.clientWidth);
      setH(el.clientHeight);
    });
    ro.observe(el);
    setW(el.clientWidth);
    setH(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  if (level === "EXTERIOR" || specs.length === 0) return null;

  const left = specs.filter((s) => s.side === "left");
  const right = specs.filter((s) => s.side === "right");

  /** Stable vertical slots — filter above pump on left; sensor tracks target on right */
  const cardYFor = (
    list: typeof specs,
    id: string,
    scrY: number | undefined,
  ) => {
    if (id === "FILTER") return Math.min(Math.max(56, 52), h - 56);
    if (id === "PUMP") return Math.min(Math.max(118, 110), h - 56);
    if (id === "SENSOR" || id === "FOCUS") {
      const prefer = scrY != null ? scrY - 14 : 72;
      return Math.min(Math.max(prefer, 48), h - 56);
    }
    const idx = list.findIndex((x) => x.id === id);
    const prefer = scrY != null ? scrY - 16 : 56 + idx * 52;
    return Math.min(Math.max(prefer, 44 + idx * 50), h - 52);
  };

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-10">
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        {specs.map((s) => {
          const scr = screens[s.id];
          if (!scr?.visible) return null;
          const isLeft = s.side === "left";
          const list = isLeft ? left : right;
          const cy = cardYFor(list, s.id, scr.y) + 14;
          const sx = isLeft ? RAIL + CARD_W : w - RAIL - CARD_W;
          const clampedX = isLeft
            ? Math.min(scr.x, sx + MAX_LEADER_X)
            : Math.max(scr.x, sx - MAX_LEADER_X);
          const midX = isLeft
            ? sx + Math.min(32, Math.max(14, (clampedX - sx) * 0.4))
            : sx - Math.min(32, Math.max(14, (sx - clampedX) * 0.4));
          const color = s.accent ? "#f59e0b" : "#94a3b8";
          const d = `M ${sx} ${cy} L ${midX} ${cy} L ${midX} ${scr.y} L ${clampedX} ${scr.y}`;
          return (
            <g key={s.id}>
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={1.15}
                strokeOpacity={0.9}
              />
              <circle
                cx={scr.x}
                cy={scr.y}
                r={3.5}
                fill={color}
                stroke="#0f172a"
                strokeWidth={1}
              />
            </g>
          );
        })}
      </svg>

      {specs.map((s) => {
        const scr = screens[s.id];
        const isLeft = s.side === "left";
        const list = isLeft ? left : right;
        const top = cardYFor(list, s.id, scr?.y);
        return (
          <button
            key={s.id}
            type="button"
            className={`pointer-events-auto absolute rounded border px-2 py-1 text-left shadow-md ${
              s.accent
                ? "border-amber-500/70 bg-slate-950/90 text-amber-50"
                : "border-slate-500/60 bg-slate-950/80 text-slate-200"
            }`}
            style={{
              width: CARD_W,
              top,
              ...(isLeft ? { left: RAIL } : { right: RAIL }),
            }}
            onClick={() => {
              if (s.clickId) selectObject(s.clickId);
            }}
          >
            <div className="line-clamp-1 text-[10px] font-semibold leading-tight">
              {s.title}
            </div>
            {s.subtitle ? (
              <div className="line-clamp-1 text-[9px] leading-tight text-slate-400">
                {s.subtitle}
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
