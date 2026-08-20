import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  fetchMaintenanceHistory,
  fetchMaintenanceStats,
  postMaintenanceHistory,
  listAircraftLocal,
} from "../services/maintenanceHistoryService";
import { useAppStore } from "../stores/useAppStore";
import type {
  MaintenanceHistoryFilters,
  MaintenanceHistoryRecord,
  MaintenanceHistoryStats,
} from "../types/maintenance";

export function MaintenanceHistoryPanel() {
  const aircraftId = useAppStore((s) => s.aircraftId);
  const aircraftInfo = useAppStore((s) => s.aircraftInfo);
  const setAircraftId = useAppStore((s) => s.setAircraftId);
  const result = useAppStore((s) => s.diagnosisResult);
  const similar = useAppStore((s) => s.similarHistory);
  const refreshAircraft = useAppStore((s) => s.refreshAircraft);

  const [rows, setRows] = useState<MaintenanceHistoryRecord[]>([]);
  const [stats, setStats] = useState<MaintenanceHistoryStats | null>(null);
  const [selected, setSelected] = useState<MaintenanceHistoryRecord | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<MaintenanceHistoryFilters>({
    aircraft_id: aircraftId,
  });
  const [msg, setMsg] = useState<string | null>(null);
  const historyRegisterPending = useAppStore((s) => s.historyRegisterPending);
  const clearHistoryRegisterPending = useAppStore(
    (s) => s.clearHistoryRegisterPending,
  );

  const aircraftOptions = useMemo(() => listAircraftLocal(), []);

  useEffect(() => {
    if (historyRegisterPending) {
      setShowForm(true);
      clearHistoryRegisterPending();
    }
  }, [historyRegisterPending, clearHistoryRegisterPending]);

  const reload = async () => {
    const f = { ...filters, aircraft_id: filters.aircraft_id || aircraftId };
    const [list, st] = await Promise.all([
      fetchMaintenanceHistory(f),
      fetchMaintenanceStats(f.aircraft_id),
    ]);
    setRows(list);
    setStats(st);
    void refreshAircraft();
  };

  useEffect(() => {
    setFilters((f) => ({ ...f, aircraft_id: aircraftId }));
  }, [aircraftId]);

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.aircraft_id, filters.system_category, filters.severity, filters.symptom, filters.date_from, filters.date_to]);

  const prefill = {
    fault_code:
      result?.fault_code ||
      (result?.symptom_code === "ENG_OIL_PRESS_LOW"
        ? "ENG-OIL-P-01"
        : result?.symptom_code === "HYD_PRESS_LOW"
          ? "HYD-P-01"
          : result?.symptom_code === "GEN_OFF"
            ? "GEN-OFF-01"
            : ""),
    symptom:
      result?.symptom_code === "ENG_OIL_PRESS_LOW"
        ? "엔진오일 압력 저하"
        : result?.symptom_code === "HYD_PRESS_LOW"
          ? "유압 압력 이상"
          : result?.symptom_code === "GEN_OFF"
            ? "발전기 경고"
            : result?.symptom_code || "",
    diagnosis: result?.answer?.split("\n")[0] || "",
    reference_manual: result?.sources?.[0]
      ? `${result.sources[0].manual_id} / Task ${result.sources[0].task ?? ""}`
      : "",
    symptom_code: result?.symptom_code,
    system_code: result?.system_code,
    system_category:
      result?.system_code === "ENGINE_OIL"
        ? "Engine Oil System"
        : result?.system_code === "HYDRAULIC"
          ? "Hydraulic System"
          : result?.system_code === "ELECTRICAL"
            ? "Generator / Electrical System"
            : result?.system_code || "",
    component: result?.suspected_components?.[0]
      ? String(result.suspected_components[0])
      : "",
    detected_value:
      result?.system_code === "ENGINE_OIL"
        ? "31 PSI"
        : result?.system_code === "HYDRAULIC"
          ? "2400 PSI"
          : "",
    normal_range:
      result?.system_code === "ENGINE_OIL"
        ? "45~65 PSI"
        : result?.system_code === "HYDRAULIC"
          ? "2500~3500 PSI"
          : "",
  };

  return (
    <div className="space-y-3 text-sm">
      {/* Aircraft summary + stats */}
      <div className="flex flex-wrap items-start justify-between gap-2 rounded border border-slate-200 bg-slate-50 p-2">
        <div>
          <div className="text-xs font-medium text-navy">
            {aircraftInfo?.display_name ||
              `${aircraftInfo?.aircraft_type || "MUH-1"} / 기체번호 ${aircraftInfo?.aircraft_number || "001"}`}
          </div>
          <div className="text-[11px] text-slate-600">
            누적 비행시간{" "}
            {(aircraftInfo?.total_flight_hours ?? 0).toLocaleString()} Hr · 누적
            정비이력 {stats?.total ?? aircraftInfo?.maintenance_count ?? "—"}건
          </div>
        </div>
        <label className="text-[11px] text-slate-500">
          항공기
          <select
            className="ml-1 rounded border border-slate-200 px-1.5 py-1 text-xs"
            value={aircraftId}
            onChange={(e) => setAircraftId(e.target.value)}
          >
            {aircraftOptions.map((a) => (
              <option key={a.aircraft_id} value={a.aircraft_id}>
                {a.display_name || a.aircraft_id}
              </option>
            ))}
          </select>
        </label>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="총 정비이력" value={`${stats.total}`} />
          <Stat label="최근 30일" value={`${stats.last_30_days}`} />
          <Stat label="재발 건수" value={`${stats.recurrence_count}`} />
          <Stat
            label="주요 반복"
            value={
              stats.top_faults[0]
                ? `${stats.top_faults[0].symptom.slice(0, 18)} (${stats.top_faults[0].count})`
                : "—"
            }
          />
        </div>
      ) : null}

      {stats && stats.top_faults.length > 0 ? (
        <div className="rounded border border-slate-200 p-2 text-xs">
          <div className="text-[11px] font-medium text-navy">주요 반복 고장</div>
          <ol className="mt-1 list-inside list-decimal text-slate-700">
            {stats.top_faults.slice(0, 3).map((f) => (
              <li key={f.symptom}>
                {f.symptom} — {f.count}건
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        <input
          type="date"
          className="rounded border border-slate-200 px-1.5 py-1"
          value={filters.date_from || ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, date_from: e.target.value || undefined }))
          }
        />
        <input
          type="date"
          className="rounded border border-slate-200 px-1.5 py-1"
          value={filters.date_to || ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, date_to: e.target.value || undefined }))
          }
        />
        <input
          placeholder="계통"
          className="w-28 rounded border border-slate-200 px-1.5 py-1"
          value={filters.system_category || ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              system_category: e.target.value || undefined,
            }))
          }
        />
        <input
          placeholder="증상/키워드"
          className="w-36 rounded border border-slate-200 px-1.5 py-1"
          value={filters.symptom || ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, symptom: e.target.value || undefined }))
          }
        />
        <select
          className="rounded border border-slate-200 px-1.5 py-1"
          value={filters.severity || ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              severity: e.target.value || undefined,
            }))
          }
        >
          <option value="">위험도 전체</option>
          <option value="Warning">Warning</option>
          <option value="Caution">Caution</option>
        </select>
        <button
          type="button"
          className="rounded bg-navy px-2 py-1 text-white"
          onClick={() => void reload()}
        >
          검색
        </button>
        <button
          type="button"
          className="ml-auto rounded border border-slate-200 px-2 py-1"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "등록 닫기" : "정비 결과 등록"}
        </button>
      </div>

      {similar.length > 0 && !showForm ? (
        <div className="rounded border border-amber-100 bg-amber-50/50 p-2 text-xs">
          <div className="font-medium text-navy">
            현재 진단 기준 유사 사례 {similar.length}건
          </div>
          <ul className="mt-1 space-y-1 text-slate-700">
            {similar.slice(0, 3).map((s) => (
              <li key={s.record.maintenance_id}>
                <button
                  type="button"
                  className="text-left hover:underline"
                  onClick={() => setSelected(s.record)}
                >
                  {s.similarity_percent}% · {s.record.maintenance_date} ·{" "}
                  {s.record.symptom} → {s.record.root_cause}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showForm ? (
        <RegisterForm
          aircraftId={aircraftId}
          prefill={prefill}
          onDone={async () => {
            setShowForm(false);
            setMsg("정비이력이 등록되었습니다.");
            await reload();
            void useAppStore.getState().loadRelatedData();
          }}
        />
      ) : null}

      {msg ? <p className="text-xs text-emerald-600">{msg}</p> : null}

      {/* Table */}
      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="min-w-full text-left text-[11px]">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-2 py-1.5">정비일자</th>
              <th className="px-2 py-1.5">비행시간</th>
              <th className="px-2 py-1.5">계통</th>
              <th className="px-2 py-1.5">고장증상</th>
              <th className="px-2 py-1.5">원인</th>
              <th className="px-2 py-1.5">정비조치</th>
              <th className="px-2 py-1.5">결과</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.maintenance_id}
                className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${
                  selected?.maintenance_id === r.maintenance_id
                    ? "bg-brand/5"
                    : ""
                }`}
                onClick={() => setSelected(r)}
              >
                <td className="px-2 py-1.5 whitespace-nowrap">
                  {r.maintenance_date}
                </td>
                <td className="px-2 py-1.5 text-right">
                  {r.flight_hours?.toLocaleString()}
                </td>
                <td className="px-2 py-1.5">{r.system_category}</td>
                <td className="px-2 py-1.5">{r.symptom}</td>
                <td className="px-2 py-1.5">{r.root_cause}</td>
                <td className="px-2 py-1.5">{r.maintenance_action}</td>
                <td className="px-2 py-1.5">{r.maintenance_result}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-2 py-4 text-center text-slate-500"
                >
                  조건에 맞는 정비이력이 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selected ? (
        <DetailCard record={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 px-2 py-1.5">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-xs font-medium text-navy">{value}</div>
    </div>
  );
}

function DetailCard({
  record,
  onClose,
}: {
  record: MaintenanceHistoryRecord;
  onClose: () => void;
}) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3 text-xs shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-medium text-navy">
          {record.maintenance_id} · 상세
        </div>
        <button type="button" className="text-slate-500" onClick={onClose}>
          닫기
        </button>
      </div>
      <dl className="grid grid-cols-1 gap-1 md:grid-cols-2">
        <Item label="고장증상" value={record.symptom} />
        <Item
          label="센서값"
          value={`${record.detected_value || "—"} (정상 ${record.normal_range || "—"})`}
        />
        <Item label="진단" value={record.diagnosis} />
        <Item label="원인" value={record.root_cause} />
        <Item label="정비작업" value={record.maintenance_action} />
        <Item label="교체부품" value={record.replaced_part || "—"} />
        <Item label="정비사 기록" value={record.technician_note || "—"} />
        <Item label="조치결과" value={record.maintenance_result} />
        <Item label="기술교범" value={record.reference_manual || "—"} />
        <Item label="재발" value={record.recurrence ? "예" : "아니오"} />
      </dl>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] text-slate-500">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
    </div>
  );
}

function RegisterForm({
  aircraftId,
  prefill,
  onDone,
}: {
  aircraftId: string;
  prefill: Record<string, string | undefined>;
  onDone: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    maintenance_date: new Date().toISOString().slice(0, 10),
    fault_code: prefill.fault_code || "",
    symptom: prefill.symptom || "",
    diagnosis: prefill.diagnosis || "",
    root_cause: "",
    maintenance_action: "",
    replaced_part: "",
    maintenance_result: "",
    technician_note: "",
    reference_manual: prefill.reference_manual || "",
    detected_value: prefill.detected_value || "",
    normal_range: prefill.normal_range || "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.root_cause.trim() || !form.maintenance_action.trim() || !form.maintenance_result.trim()) {
      setErr("원인 · 정비작업 · 결과는 필수입니다.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await postMaintenanceHistory({
        aircraft_id: aircraftId,
        maintenance_date: form.maintenance_date,
        fault_code: form.fault_code,
        symptom: form.symptom,
        diagnosis: form.diagnosis,
        root_cause: form.root_cause,
        maintenance_action: form.maintenance_action,
        replaced_part: form.replaced_part || undefined,
        maintenance_result: form.maintenance_result,
        technician_note: form.technician_note || undefined,
        reference_manual: form.reference_manual || undefined,
        detected_value: form.detected_value || undefined,
        normal_range: form.normal_range || undefined,
        system_category: prefill.system_category,
        component: prefill.component,
        symptom_code: prefill.symptom_code,
        system_code: prefill.system_code,
        severity: "Warning",
      });
      await onDone();
    } catch {
      setErr("등록에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    opts?: { readOnly?: boolean },
  ) => (
    <label className="block text-[11px]">
      <span className="text-slate-500">{label}</span>
      <input
        className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
        value={form[key]}
        readOnly={opts?.readOnly}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </label>
  );

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-2 rounded border border-slate-200 p-3 md:grid-cols-2"
    >
      <div className="md:col-span-2 text-xs font-medium text-navy">
        정비 결과 등록
      </div>
      {field("maintenance_date", "정비일자")}
      <div className="text-[11px] text-slate-500">
        대상 항공기
        <div className="mt-0.5 rounded border border-slate-100 bg-slate-50 px-2 py-1.5 text-xs text-slate-800">
          {aircraftId}
        </div>
      </div>
      {field("fault_code", "고장코드", { readOnly: !!prefill.fault_code })}
      {field("symptom", "고장증상", { readOnly: !!prefill.symptom })}
      {field("diagnosis", "진단결과")}
      {field("detected_value", "검출값")}
      {field("root_cause", "원인 *")}
      {field("maintenance_action", "수행 정비작업 *")}
      {field("replaced_part", "교체부품")}
      {field("maintenance_result", "정비결과 *")}
      {field("technician_note", "정비사 메모")}
      {field("reference_manual", "관련 기술교범")}
      <div className="md:col-span-2 flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-navy px-3 py-1.5 text-xs text-white hover:bg-navy-700 disabled:opacity-50"
        >
          {busy ? "등록 중…" : "등록"}
        </button>
        {err ? <span className="text-xs text-danger">{err}</span> : null}
      </div>
    </form>
  );
}
