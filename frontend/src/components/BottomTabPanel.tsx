import { useAppStore } from "../stores/useAppStore";
import type { BottomTab } from "../types/diagnosis";
import { ManualPanel } from "./ManualPanel";
import { FailureCasePanel } from "./FailureCasePanel";
import { MaintenanceGuidePanel } from "./MaintenanceGuidePanel";
import { MaintenanceHistoryPanel } from "./MaintenanceHistoryPanel";
import { DemoControlPanel } from "./DemoControlPanel";

const TABS: { id: BottomTab; label: string }[] = [
  { id: "manual", label: "기술교범" },
  { id: "failure", label: "유사 정비사례" },
  { id: "guide", label: "정비 가이드" },
  { id: "history", label: "정비이력" },
];

export function BottomTabPanel() {
  const active = useAppStore((s) => s.activeBottomTab);
  const setActiveBottomTab = useAppStore((s) => s.setActiveBottomTab);

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 border-b border-slate-100 bg-white px-2 py-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveBottomTab(t.id)}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              active === t.id
                ? "bg-navy text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto">
          <DemoControlPanel compact />
        </div>
      </div>
      <div className="min-h-[300px] p-3">
        {active === "manual" && <ManualPanel />}
        {active === "failure" && <FailureCasePanel />}
        {active === "guide" && <MaintenanceGuidePanel />}
        {active === "history" && <MaintenanceHistoryPanel />}
      </div>
    </section>
  );
}
