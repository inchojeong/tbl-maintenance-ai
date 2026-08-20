import { Header } from "./components/Header";
import { AIQueryPanel } from "./components/AIQueryPanel";
import { DiagnosisPanel } from "./components/DiagnosisPanel";
import { BottomTabPanel } from "./components/BottomTabPanel";
import { AircraftViewer } from "./three/AircraftViewer";

/** Fixed top workspace height so 3D does not shrink with bottom content. */
const TOP_ROW_H = 480;

export default function App() {
  return (
    <div className="min-h-screen min-w-[1100px] bg-surface">
      <Header />
      <main className="flex flex-col gap-3 p-3">
        {/* Top: fixed-height workspace */}
        <div
          className="grid grid-cols-[22%_53%_25%] gap-3"
          style={{ height: TOP_ROW_H }}
        >
          <div className="min-h-0 h-full">
            <AIQueryPanel />
          </div>
          <div className="min-h-0 h-full">
            <AircraftViewer />
          </div>
          <div className="min-h-0 h-full">
            <DiagnosisPanel />
          </div>
        </div>

        {/* Bottom: grows with content → browser page scroll */}
        <BottomTabPanel />
      </main>
      <footer
        className="border-t border-slate-200 bg-white px-4 py-1.5 text-[10px] text-slate-500"
        title="실제 군 내부 데이터 및 실기체 기술교범을 사용하지 않습니다."
      >
        Prototype Demo · 공개 기술자료 기반
      </footer>
    </div>
  );
}
