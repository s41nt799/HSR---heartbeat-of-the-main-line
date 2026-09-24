import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { scenariosApi, sessionsApi } from '../api';
import { getErrorMessage } from '../api/client';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { SkeletonCards } from '../components/LoadingState';
import { useToast } from '../store/toastStore';
import { difficultyLabel } from '../utils/format';

export function ScenariosPage() {
  const navigate = useNavigate();
  const { show } = useToast();

  const scenariosQuery = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => scenariosApi.list({ limit: 20, offset: 0 }),
    staleTime: 30_000,
  });

  const startMutation = useMutation({
    mutationFn: (scenarioId: string) =>
      sessionsApi.create({ scenario_id: scenarioId }),
    onSuccess: (data) => {
      navigate(`/sessions/${data.session_id}/play`);
    },
    onError: (err) => {
      show(getErrorMessage(err, 'Не удалось начать сессию'), 'error');
    },
  });

  if (scenariosQuery.isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Сценарии</h1>
        <SkeletonCards count={2} />
      </div>
    );
  }

  if (scenariosQuery.isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Сценарии</h1>
        <ErrorState
          message={getErrorMessage(scenariosQuery.error)}
          onRetry={() => void scenariosQuery.refetch()}
        />
      </div>
    );
  }

  const items = scenariosQuery.data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Сценарии</h1>
        <EmptyState
          title="Пока нет доступных сценариев"
          description="Когда backend опубликует сценарии, они появятся здесь."
          actionLabel="Обновить"
          onAction={() => void scenariosQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Сценарии</h1>
        <p className="mt-1 text-sm text-slate-400">
          Выберите ситуацию и отработайте решения проводника
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className="card text-left transition-colors hover:border-indigo-500/50 disabled:opacity-50"
            disabled={startMutation.isPending}
            onClick={() => startMutation.mutate(scenario.id)}
          >
            <h2 className="text-lg font-medium text-slate-100">{scenario.title}</h2>
            <p className="mt-2 line-clamp-3 text-sm text-slate-400">{scenario.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-300">
                {difficultyLabel(scenario.difficulty)}
              </span>
              <span className="rounded-md bg-amber-500/15 px-2 py-1 text-amber-300">
                Лучший счёт:{' '}
                {scenario.best_score === null || scenario.best_score === undefined
                  ? '—'
                  : scenario.best_score}
              </span>
            </div>
          </button>
        ))}
      </div>

      {startMutation.isPending && (
        <p className="text-center text-sm text-slate-400">Создание сессии…</p>
      )}
    </div>
  );
}
