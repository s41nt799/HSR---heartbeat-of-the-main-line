import { useToastStore, type ToastType } from '../store/toastStore';

export function useToast() {
  const show = useToastStore((s) => s.show);
  return {
    show: (message: string, type: ToastType = 'info') => show(message, type),
  };
}
