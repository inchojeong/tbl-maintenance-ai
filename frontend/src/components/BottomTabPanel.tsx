import { useAppStore } from "../stores/useAppStore";
import type { BottomTab } from "../types/diagnosis";
import { ManualPanel } from "./ManualPanel";
import { FailureCasePanel } from "./FailureCasePanel";
import { PHMPanel } from "./PHMPanel";
import { MaintenanceGuidePanel } from "./MaintenanceGuidePanel";
import { MaintenanceHistoryPanel } from "./MaintenanceHistoryPanel";
import { DemoControlPanel } from "./DemoControlPanel";

const TABS: { id: BottomTab; label: string }[] = [
  { id: "manual", label: "교범" },
  { id: "failure", label: "유사 고장" },
  { id: "phm", label: "PHM" },
  { id: "guide", label: "정비 가이드" },
  { id: "history", label: "정비이력" },
];

export function BottomTabPanel() {
  const active = useAppStore((s) => s.activeBottomTab);
  const setActiveBottomTab = useAppStore((s) => s.setActiveBottomTab);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 px-2 py-1.5">
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
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {active === "manual" && <ManualPanel />}
        {active === "failure" && <FailureCasePanel />}
        {active === "phm" && <PHMPanel />}
        {active === "guide" && <MaintenanceGuidePanel />}
        {active === "history" && <MaintenanceHistoryPanel />}
      </div>
    </section>
  );
}
