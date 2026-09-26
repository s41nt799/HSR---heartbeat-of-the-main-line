import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from '../api';
import { getErrorMessage } from '../api/client';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const MEDALS = ['🥇', '🥈', '🥉'] as const;

export function LeaderboardPage() {
  const { user } = useAuth();
  const { show } = useToast();

  const query = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => leaderboardApi.get(50),
  });

  if (query.isLoading) {
    return <LoadingState label="Загрузка лидерборда…" />;
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

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Лидерборд</h1>
        <EmptyState
          title="Пока никого нет"
          description="Сыграйте сценарий — рейтинг появится здесь. Backend может отдавать fallback из Postgres."
          actionLabel="Обновить"
          onAction={() => void query.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Лидерборд</h1>
        <p className="mt-1 text-sm text-slate-400">Топ игроков по очкам</p>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[20rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Игрок</th>
              <th className="px-4 py-3 text-right font-medium">Очки</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const isMe = user?.id === row.user_id;
              const top3 = row.rank >= 1 && row.rank <= 3;
              return (
                <tr
                  key={`${row.user_id}-${row.rank}`}
                  className={`border-b border-slate-800/80 last:border-0 ${
                    isMe ? 'bg-indigo-500/15' : top3 ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <td className="px-4 py-3 tabular-nums">
                    {top3 ? (
                      <span className="text-base" title={`${row.rank} место`}>
                        {MEDALS[row.rank - 1]}
                      </span>
                    ) : (
                      <span className="text-slate-400">{row.rank}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={isMe ? 'font-medium text-indigo-200' : 'text-slate-100'}>
                      {row.display_name}
                      {isMe ? ' (вы)' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-amber-300">
                    {row.score}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
