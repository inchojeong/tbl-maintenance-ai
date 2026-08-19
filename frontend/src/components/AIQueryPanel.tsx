import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { useAppStore } from "../stores/useAppStore";

export function AIQueryPanel() {
  const messages = useAppStore((s) => s.messages);
  const isLoading = useAppStore((s) => s.isLoading);
  const submitQuery = useAppStore((s) => s.submitQuery);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = input;
    setInput("");
    void submitQuery(q);
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-3 py-2">
        <h2 className="text-sm font-semibold text-navy">AI 질의</h2>
        <p className="text-[11px] text-slate-500">텍스트 · 시연용</p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-md px-2.5 py-2 text-sm ${
              m.role === "user"
                ? "ml-4 bg-navy text-white"
                : m.role === "system"
                  ? "bg-amber-50 text-amber-900"
                  : "mr-2 bg-slate-100 text-slate-800"
            }`}
          >
            <div className="mb-0.5 text-[10px] opacity-70">
              {m.role === "user" ? "정비사" : m.role === "assistant" ? "AI" : "안내"} ·{" "}
              {m.time}
            </div>
            {m.text}
          </div>
        ))}
        {isLoading ? (
          <div className="text-xs text-slate-500">계통·증상 분석 중…</div>
        ) : null}
        <div ref={endRef} />
      </div>
      <form onSubmit={onSubmit} className="flex gap-2 border-t border-slate-100 p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="증상을 입력하세요"
          disabled={isLoading}
          className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-brand px-3 text-white hover:bg-brand-600 disabled:opacity-50"
          aria-label="전송"
        >
          <Send size={16} />
        </button>
      </form>
      <div className="flex gap-1 px-2 pb-2">
        <button
          type="button"
          className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-200"
          onClick={() =>
            void submitQuery(
              "1번 엔진 오일 압력 경고가 발생했는데 어디를 확인해야 해?",
            )
          }
        >
          대표 시나리오
        </button>
      </div>
    </section>
  );
}
