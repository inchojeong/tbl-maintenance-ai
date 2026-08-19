import { useAppStore } from "../stores/useAppStore";

export function PHMPanel() {
  const phm = useAppStore((s) => s.phm);

  if (!phm) {
    return (
      <p className="text-sm text-slate-500">
        질의 후 PHM 모의 센서값이 표시됩니다.
      </p>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
        본 PHM 정보는 시제품 시연을 위해 임의 생성된 모의 데이터입니다.
      </p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Metric label="오일 압력" value={`${phm.oil_pressure_psi} psi`} bad />
        <Metric label="오일 온도" value={`${phm.oil_temperature_c} °C`} warn />
        <Metric
          label="필터 차압"
          value={`${phm.filter_differential_pressure_psi} psi`}
          bad
        />
        <Metric label="Health" value={`${phm.health_score}`} bad />
      </div>
      {phm.estimated_rul_fh != null ? (
        <p className="text-slate-600">추정 RUL: {phm.estimated_rul_fh} FH (모의)</p>
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
    <div className="rounded border border-slate-200 p-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div
        className={`font-semibold ${bad ? "text-danger" : warn ? "text-amber-600" : "text-slate-900"}`}
      >
        {value}
      </div>
    </div>
  );
}
