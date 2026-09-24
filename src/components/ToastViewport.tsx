import { useToastStore } from '../store/toastStore';

const typeStyles = {
  success: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
  error: 'border-rose-500/40 bg-rose-500/15 text-rose-200',
  info: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-200',
};

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg ${typeStyles[toast.type]}`}
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <span>{toast.message}</span>
            <button
              type="button"
              className="text-xs opacity-70 hover:opacity-100"
              onClick={() => dismiss(toast.id)}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
