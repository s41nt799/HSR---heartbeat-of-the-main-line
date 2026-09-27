interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: (id: string) => void;
}

const typeStyles = {
  success: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
  error: 'border-rose-500/40 bg-rose-500/15 text-rose-200',
  info: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-200',
};

export function Toast({ id, message, type, onDismiss }: ToastProps) {
  return (
    <div
      className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg animate-[fadeIn_150ms_ease-out] ${typeStyles[type]}`}
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <span>{message}</span>
        <button
          type="button"
          className="shrink-0 text-xs opacity-70 hover:opacity-100"
          onClick={() => onDismiss(id)}
          aria-label="Закрыть"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
