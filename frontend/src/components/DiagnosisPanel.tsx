import type { ReactNode } from "react";
import { useAppStore } from "../stores/useAppStore";
import {
  labelComponent,
  labelRisk,
  labelSystem,
  labelSymptomStatus,
  measuredForSymptom,
  tdLocationSentence,
} from "../services/displayLabels";

/**
 * Right-rail diagnosis: status → AI judgment → evidence → recommended steps.
 * Logic unchanged; presentation only.
 */
export function DiagnosisPanel() {
  const result = useAppStore((s) => s.diagnosisResult);
  const historyInsight = useAppStore((s) => s.historyInsight);
  const similar = useAppStore((s) => s.similarHistory);
  const applyViewTarget = useAppStore((s) => s.applyViewTarget);
  const setActiveBottomTab = useAppStore((s) => s.setActiveBottomTab);
  const openPanel = useAppStore((s) => s.openPanel);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-3 py-2">
        <h2 className="text-sm font-semibold text-navy">핵심 분석정보</h2>
        <p className="text-[11px] text-slate-500">
          상태 · 판단 · 근거 · 조치
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 text-sm">
        {!result ? (
          <p className="text-slate-500">
            질의 후 현재 이상 상태와 AI 판단이 표시됩니다.
          </p>
        ) : (
          <>
            {/* ① 현재 이상 상태 */}
            <Section title="현재 이상 상태">
              <dl className="mt-1.5 space-y-1.5">
                <InfoRow
                  label="계통"
                  value={labelSystem(result.system_code)}
                />
                <InfoRow
                  label="상태"
                  value={labelSymptomStatus(result.symptom_code)}
                />
                {(() => {
                  const m = measuredForSymptom(result.symptom_code);
                  if (!m) return null;
                  return (
                    <>
                      <InfoRow label="측정값" value={m.value} emphasize />
                      <InfoRow label="정상범위" value={m.normal} />
                    </>
                  );
                })()}
                <div className="flex items-center gap-2">
                  <dt className="w-14 shrink-0 text-[11px] text-slate-500">
                    위험도
                  </dt>
                  <dd>
                    <RiskBadge level={result.risk_level} />
                  </dd>
                </div>
              </dl>
            </Section>

            {/* ② AI 판단 */}
            <Section title="AI 판단">
              <p className="mt-1.5 text-xs leading-relaxed text-slate-800">
                {judgmentLead(result.system_code, result.symptom_code)}
              </p>
              {result.suspected_components?.length ? (
                <div className="mt-2">
                  <div className="text-[11px] text-slate-500">
                    우선 점검 대상
                  </div>
                  <ul className="mt-0.5 list-inside list-disc text-xs text-slate-800">
                    {result.suspected_components.map((c) => (
                      <li key={c}>{labelComponent(c)}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {historyInsight ? (
                <p className="mt-2 rounded border border-slate-100 bg-slate-50 p-2 text-[11px] leading-relaxed text-slate-700">
                  {historyInsight}
                </p>
              ) : null}
            </Section>

            {/* ③ 판단 근거 */}
            <Section title="판단 근거">
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-navy">
                  기술교범 {result.sources?.length ?? 0}건
                  <span className="ml-1 text-slate-400">공식 정비근거</span>
                </span>
                <span className="rounded border border-amber-200 bg-amber-50/50 px-2 py-0.5 text-[11px] text-navy">
                  유사 정비사례 {similar.length}건
                  <span className="ml-1 text-slate-400">과거 사례 참고</span>
                </span>
              </div>
              {result.sources?.[0] ? (
                <div className="mt-2 rounded bg-slate-50 p-2 text-[11px] text-slate-700">
                  <div className="font-medium text-navy">
                    {result.sources[0].manual_id}
                  </div>
                  <div>
                    Task {result.sources[0].task ?? result.sources[0].paragraph}
                    {result.sources[0].pdf_page != null
                      ? ` · p.${result.sources[0].pdf_page}`
                      : ""}
                  </div>
                  {result.sources[0].title ? (
                    <div className="mt-0.5 text-slate-500">
                      {result.sources[0].title}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {similar[0] ? (
                <div className="mt-2 rounded border border-amber-100 bg-amber-50/40 p-2 text-[11px] text-slate-700">
                  <div className="font-medium text-navy">
                    가장 유사한 사례 · {similar[0].similarity_percent}%
                  </div>
                  <div className="mt-0.5">{similar[0].record.symptom}</div>
                  <div>원인: {similar[0].record.root_cause}</div>
                  <div>조치: {similar[0].record.maintenance_action}</div>
                </div>
              ) : null}
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  className="rounded border border-slate-200 py-1.5 text-[11px] text-navy hover:bg-slate-50"
                  onClick={() => setActiveBottomTab("manual")}
                >
                  기술교범 보기
                </button>
                <button
                  type="button"
                  className="rounded border border-slate-200 py-1.5 text-[11px] text-navy hover:bg-slate-50"
                  onClick={() => setActiveBottomTab("failure")}
                >
                  유사 정비사례 보기
                </button>
              </div>
            </Section>

            {/* ④ 권장 조치 */}
            <Section title="권장 점검 순서">
              <ol className="mt-1.5 list-decimal space-y-1.5 pl-4 text-xs text-slate-800">
                {result.recommended_steps.map((s, i) => (
                  <li key={`${i}-${s}`}>{s}</li>
                ))}
              </ol>
            </Section>

            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                className="w-full rounded bg-navy py-2 text-xs font-medium text-white hover:bg-navy-700"
                onClick={() => {
                  setActiveBottomTab("guide");
                  applyViewTarget(result.view_target_id);
                }}
              >
                3D 점검 위치 보기
              </button>
              {result.system_code === "ENGINE_OIL" ? (
                <button
                  type="button"
                  className="w-full rounded border border-slate-200 py-2 text-xs hover:bg-slate-50"
                  onClick={() => openPanel("ENGINE_PANEL_LEFT")}
                >
                  엔진 내부 점검 위치 보기
                </button>
              ) : null}
              <p className="text-[11px] text-slate-500">
                {tdLocationSentence(result.td_grade)}
              </p>
              <p className="text-[10px] text-slate-400">
                AI 분석 신뢰도 {(result.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-slate-200 p-2.5">
      <h3 className="text-[11px] font-semibold tracking-wide text-navy">
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <dt className="w-14 shrink-0 text-[11px] text-slate-500">{label}</dt>
      <dd
        className={`text-xs ${emphasize ? "font-semibold text-danger" : "font-medium text-slate-900"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    HIGH: "bg-red-100 text-danger",
    MEDIUM: "bg-amber-100 text-amber-800",
    LOW: "bg-emerald-100 text-emerald-800",
  };
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${map[level] ?? "bg-slate-100 text-slate-700"}`}
    >
      {labelRisk(level)}
    </span>
  );
}

function judgmentLead(system: string, symptom: string): string {
  if (system === "ENGINE_OIL" || symptom.includes("OIL_PRESS")) {
    return "엔진 오일 압력 저하가 확인되었습니다. 오일량, 오일필터 및 압력센서 계통을 우선 점검하십시오.";
  }
  if (system === "HYDRAULIC") {
    return "유압 압력 이상이 확인되었습니다. 유압유 잔량, 펌프 및 압력센서 계통을 우선 점검하십시오.";
  }
  if (system === "ELECTRICAL") {
    return "발전기·전기계통 이상이 확인되었습니다. 발전기 출력, 전압조정기 및 관련 배선 상태를 우선 점검하십시오.";
  }
  return `${labelSystem(system)} 이상이 확인되었습니다. 권장 점검 순서에 따라 확인하십시오.`;
}
