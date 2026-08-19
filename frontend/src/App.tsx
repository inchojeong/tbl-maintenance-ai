import { Header } from "./components/Header";
import { AIQueryPanel } from "./components/AIQueryPanel";
import { DiagnosisPanel } from "./components/DiagnosisPanel";
import { BottomTabPanel } from "./components/BottomTabPanel";
import { AircraftViewer } from "./three/AircraftViewer";

export default function App() {
  return (
    <div className="flex h-full min-h-screen min-w-[1100px] flex-col bg-surface">
      <Header />
      <main className="grid min-h-0 flex-1 grid-cols-[22%_53%_25%] grid-rows-[minmax(0,1fr)_220px] gap-3 p-3">
        <div className="min-h-0">
          <AIQueryPanel />
        </div>
        <div className="min-h-0">
          <AircraftViewer />
        </div>
        <div className="min-h-0">
          <DiagnosisPanel />
        </div>
        <div className="col-span-3 min-h-0">
          <BottomTabPanel />
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white px-4 py-1.5 text-[10px] text-slate-500">
        본 시제품의 항공기 형상, 교범, 부품명, 센서값, 고장사례 및 점검절차는 기술
        검증을 위해 임의 가공한 모의 데이터이며 실제 수리온 정비자료와 무관합니다.
      </footer>
    </div>
  );
}
