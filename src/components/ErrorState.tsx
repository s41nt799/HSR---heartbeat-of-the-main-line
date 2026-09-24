interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Не удалось загрузить данные',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="card flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
        !
      </div>
      <div>
        <p className="font-medium text-slate-100">Ошибка</p>
        <p className="mt-1 text-sm text-slate-400">{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
}
