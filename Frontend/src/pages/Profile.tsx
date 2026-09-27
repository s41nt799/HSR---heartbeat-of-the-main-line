import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { profileApi } from '../api';
import { getErrorMessage } from '../api/client';
import { AchievementCard } from '../components/AchievementCard';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LevelBadge } from '../components/LevelBadge';
import { LoadingState } from '../components/LoadingState';
import { useLevel } from '../hooks/useLevel';
import { useToast } from '../hooks/useToast';
import {
  formatRelativeTime,
  sessionStateClass,
  sessionStateLabel,
} from '../utils/format';

export function ProfilePage() {
  const { show } = useToast();
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
  });

  const user = profileQuery.data?.user;
  const levelInfo = useLevel(user?.total_score ?? 0, user?.level);

  if (profileQuery.isLoading) {
    return <LoadingState label="Загрузка профиля…" />;
  }

  if (profileQuery.isError) {
    const status = (profileQuery.error as { response?: { status?: number } })?.response
      ?.status;
    if (status === 404) {
      return (
        <EmptyState
          title="Профиль не найден"
          description="Данные пользователя недоступны."
        />
      );
    }
    return (
      <ErrorState
        message={getErrorMessage(profileQuery.error)}
        onRetry={() => {
          show('Повтор загрузки…', 'info');
          void profileQuery.refetch();
        }}
      />
    );
  }

  const data = profileQuery.data;
  if (!data) {
    return (
      <EmptyState
        title="Нет данных профиля"
        actionLabel="Обновить"
        onAction={() => void profileQuery.refetch()}
      />
    );
  }

  const { stats, recent_sessions, achievements_preview } = data;
  const profileUser = data.user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Профиль</h1>
        <p className="mt-1 text-sm text-slate-400">{profileUser.email}</p>
      </div>

      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-slate-100">{profileUser.display_name}</h2>
            <LevelBadge
              level={profileUser.level}
              score={profileUser.total_score}
              compact={false}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>Прогресс до ур. {levelInfo.level + 1}</span>
            <span>{levelInfo.pointsToNext} очков</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-indigo-500 transition-[width] duration-300"
              style={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Статистика
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Завершено" value={stats.sessions_completed} />
          <StatCard label="Провалено" value={stats.sessions_failed} />
          <StatCard label="Средний счёт" value={Math.round(stats.avg_score)} />
          <StatCard label="Лучший счёт" value={stats.best_score} accent />
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Недавние сессии
        </h2>
        {recent_sessions.length === 0 ? (
          <p className="text-sm text-slate-500">Пока нет завершённых сессий</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {recent_sessions.map((s) => (
              <li key={s.session_id}>
                <Link
                  to={`/sessions/${s.session_id}/debrief`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm transition-colors hover:text-indigo-300"
                >
                  <div>
                    <div className="font-medium text-slate-100">{s.scenario_title}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {formatRelativeTime(s.finished_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={sessionStateClass(s.state)}>
                      {sessionStateLabel(s.state)}
                    </span>
                    <span className="tabular-nums text-amber-300">{s.score}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Достижения
        </h2>
        {achievements_preview.length === 0 ? (
          <EmptyState
            title="Пока нет достижений"
            description="Пройдите сценарии, чтобы открыть ачивки."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {achievements_preview.map((a) => (
              <AchievementCard key={a.code} achievement={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className={`card text-center ${accent ? 'border-amber-500/30' : ''}`}>
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          accent ? 'text-amber-300' : 'text-slate-100'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
