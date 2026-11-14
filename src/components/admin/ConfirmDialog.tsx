import { useEffect } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#131416]/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        data-ui="modal"
        className="w-full max-w-md rounded-[12px] border border-[#e8eaec] bg-[#ffffff] p-6"
      >
        <h3
          id="confirm-dialog-title"
          className="break-words text-[16px] font-semibold text-[#131416]"
        >
          {title}
        </h3>
        <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-[1.5] text-[#5d5f60]">
          {message}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex h-8 items-center justify-center rounded-[6px] border border-[#e8eaec] bg-[#ffffff] px-3.5 text-[13px] font-medium text-[#131416] hover:border-[#cdced1] hover:bg-[#f4f6f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5be3]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-8 items-center justify-center rounded-[6px] bg-[#c4242a] px-3.5 text-[13px] font-medium text-white hover:bg-[#a61d22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4242a] disabled:opacity-50"
          >
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
