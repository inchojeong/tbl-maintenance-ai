import { useAppStore } from "../stores/useAppStore";

export function PHMPanel() {
  const phm = useAppStore((s) => s.phm);
  const isDemoMode = useAppStore((s) => s.isDemoMode);

  if (!phm) {
    return (
      <p className="text-sm text-slate-500">
        {isDemoMode
          ? "오프라인 데모에서는 상태예측(PHM) 센서값을 표시하지 않습니다. 온라인 모드에서 확인하십시오."
          : "질의 후 상태예측(PHM) 센서값이 표시됩니다."}
      </p>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Metric label="오일 압력" value={`${phm.oil_pressure_psi} psi`} bad />
        <Metric label="오일 온도" value={`${phm.oil_temperature_c} °C`} warn />
        <Metric
          label="필터 차압"
          value={`${phm.filter_differential_pressure_psi} psi`}
          bad
        />
        <Metric label="건전성" value={`${phm.health_score}`} bad />
      </div>
      {phm.estimated_rul_fh != null ? (
        <p className="text-slate-600">
          추정 잔여수명: {phm.estimated_rul_fh} FH
        </p>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  bad,
  warn,
}: {
  label: string;
  value: string;
  bad?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded border border-slate-200 px-2 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div
        className={`text-sm font-semibold ${
          bad ? "text-danger" : warn ? "text-amber-700" : "text-slate-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
