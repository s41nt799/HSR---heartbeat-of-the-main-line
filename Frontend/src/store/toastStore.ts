import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

const MAX_TOASTS = 3;
const AUTO_HIDE_MS = 3000;

interface ToastState {
  toasts: ToastItem[];
  show: (message: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => {
      // Стек до 3: вытесняем самые старые
      const next = [...state.toasts, { id, message, type }];
      return { toasts: next.slice(-MAX_TOASTS) };
    });
    window.setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, AUTO_HIDE_MS);
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
