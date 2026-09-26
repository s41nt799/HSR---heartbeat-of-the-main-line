import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { profileApi } from '../api';
import { getErrorMessage } from '../api/client';
import { AchievementCard } from '../components/AchievementCard';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { useToast } from '../hooks/useToast';

export function AchievementsPage() {
  const { show } = useToast();
  const query = useQuery({
    queryKey: ['achievements'],
    queryFn: profileApi.achievements,
  });

  if (query.isLoading) {
    return <LoadingState label="Загрузка достижений…" />;
  }

  if (query.isError) {
    return (
      <ErrorState
        message={getErrorMessage(query.error)}
        onRetry={() => {
          show('Повтор загрузки…', 'info');
          void query.refetch();
        }}
      />
    );
  }

  const items = query.data?.items ?? [];
  const unlockedCount = items.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Достижения</h1>
          <p className="mt-1 text-sm text-slate-400">
            {items.length > 0
              ? `Открыто ${unlockedCount} из ${items.length}`
              : 'Все ачивки аккаунта'}
          </p>
        </div>
        <Link to="/profile" className="text-sm text-indigo-400 hover:text-indigo-300">
          ← К профилю
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Пока пусто"
          description="Достижения появятся после прохождения сценариев."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <AchievementCard key={a.code} achievement={a} />
          ))}
        </div>
      )}
    </div>
  );
}
