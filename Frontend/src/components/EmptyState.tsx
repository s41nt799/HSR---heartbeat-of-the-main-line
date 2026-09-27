interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400">
        ∅
      </div>
      <p className="font-medium text-slate-100">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-400">{description}</p>}
      {actionLabel && onAction && (
        <button type="button" className="btn mt-2" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
