import type { ReactNode } from 'react';
import { useToastStore } from '../store/toastStore';
import { Toast } from './Toast';

/** Провайдер: children + стек тостов (до 3). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </>
  );
}
