import { useEffect } from "react";

export function ManualPageModal({
  open,
  imageUrl,
  title,
  onClose,
}: {
  open: boolean;
  imageUrl: string;
  title: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
          <h3 className="truncate text-sm font-semibold text-navy">{title}</h3>
          <button
            type="button"
            className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-3">
          <img
            src={imageUrl}
            alt={title}
            className="mx-auto h-auto w-full max-w-full object-contain shadow"
          />
        </div>
        <p className="border-t border-slate-200 px-3 py-1.5 text-[10px] text-slate-500">
          공개 기술교범 기반 시연 자료
        </p>
      </div>
    </div>
  );
}
