export function LoadingState({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function SkeletonCards({ count = 2 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card animate-pulse space-y-3">
          <div className="h-5 w-2/3 rounded bg-slate-800" />
          <div className="h-4 w-full rounded bg-slate-800" />
          <div className="h-4 w-4/5 rounded bg-slate-800" />
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-20 rounded bg-slate-800" />
            <div className="h-6 w-16 rounded bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
