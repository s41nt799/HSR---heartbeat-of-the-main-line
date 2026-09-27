import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { sessionsApi } from '../api';
import { getErrorMessage } from '../api/client';
import { AchievementCard } from '../components/AchievementCard';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { EventRow } from '../components/EventRow';
import { LoadingState } from '../components/LoadingState';
import { useToast } from '../hooks/useToast';
import { sessionStateClass, sessionStateLabel } from '../utils/format';
import {
  getSessionScenario,
  rememberSessionScenario,
} from '../utils/sessionScenario';

const EVENTS_PREVIEW = 10;

function FinalCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className={`card text-center ${accent}`}>
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-100">{value}</div>
    </div>
  );
}

export function DebriefPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  const [showAllEvents, setShowAllEvents] = useState(false);

  const debriefQuery = useQuery({
    queryKey: ['debrief', id],
    queryFn: () => sessionsApi.getDebrief(id!),
    enabled: Boolean(id),
  });

  const replayMutation = useMutation({
    mutationFn: (scenarioId: string) =>
      sessionsApi.create(scenarioId),
    onSuccess: (data) => {
      rememberSessionScenario(data.session_id, data.scenario_id);
      navigate(`/sessions/${data.session_id}/play`);
    },
    onError: (err) => {
      show(getErrorMessage(err, 'Не удалось начать заново'), 'error');
    },
  });

  if (!id) {
    return (
      <EmptyState
        title="Сессия не найдена"
        actionLabel="К сценариям"
        onAction={() => navigate('/scenarios')}
      />
    );
  }

  if (debriefQuery.isLoading) {
    return <LoadingState label="Загрузка дебрифа…" />;
  }

  if (debriefQuery.isError) {
    const status = (debriefQuery.error as { response?: { status?: number } })?.response
      ?.status;
    if (status === 404) {
      return (
        <EmptyState
          title="Дебриф не найден"
          description="Сессия ещё активна или не существует."
          actionLabel="К сценариям"
          onAction={() => navigate('/scenarios')}
        />
      );
    }
    return (
      <ErrorState
        message={getErrorMessage(debriefQuery.error)}
        onRetry={() => {
          show('Повтор загрузки дебрифа…', 'info');
          void debriefQuery.refetch();
        }}
      />
    );
  }

  const data = debriefQuery.data;
  if (!data) {
    return (
      <EmptyState
        title="Нет данных дебрифа"
        actionLabel="Обновить"
        onAction={() => void debriefQuery.refetch()}
      />
    );
  }

  const {
    state,
    final_score,
    loyalty,
    safety,
    duration_sec,
    events,
    competency_progress,
    achievements_unlocked,
    recommendations,
  } = data;
  const scenarioId = getSessionScenario(id);

  const visibleEvents = showAllEvents ? events : events.slice(0, EVENTS_PREVIEW);
  const hasMoreEvents = events.length > EVENTS_PREVIEW;

  const handleReplay = () => {
    if (!scenarioId) {
      show('Сценарий не найден локально — выберите в списке', 'info');
      navigate('/scenarios');
      return;
    }
    replayMutation.mutate(scenarioId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Дебриф</h1>
          <p className="mt-1 text-sm text-slate-400">Разбор сессии {id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/profile" className="btn-secondary">
            В профиль
          </Link>
          <button
            type="button"
            className="btn"
            disabled={replayMutation.isPending}
            onClick={handleReplay}
          >
            Ещё раз
          </button>
        </div>
      </div>

      {/* Итог */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">Итог</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FinalCard
            label="Статус"
            value={sessionStateLabel(state)}
            accent={sessionStateClass(state)}
          />
          <FinalCard label="Loyalty" value={loyalty} accent="" />
          <FinalCard label="Safety" value={safety} accent="" />
          <FinalCard label="Score" value={final_score} accent="border-amber-500/30" />
        </div>
        <p className="text-xs text-slate-500">Длительность: {duration_sec} сек</p>
      </section>

      {/* Компетенции */}
      {competency_progress.length > 0 && (
        <section className="card space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
            Компетенции
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {competency_progress.map((cp) => (
              <div key={cp.code} className="text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">{cp.title}</span>
                  <span className="tabular-nums text-amber-300">{cp.delta > 0 ? `+${cp.delta}` : cp.delta}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* События */}
      <section className="card space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">События</h2>
        {events.length === 0 ? (
          <p className="text-sm text-slate-500">Событий нет</p>
        ) : (
          <>
            <ul className="divide-y divide-slate-800">
              {visibleEvents.map((ev, i) => (
                <EventRow
                  key={`${ev.node_key}-${ev.created_at ?? ''}-${i}`}
                  node_key={ev.node_key}
                  choice_key={ev.choice_key ?? null}
                  event_type={ev.event_type}
                  loyalty_after={ev.loyalty_after}
                  safety_after={ev.safety_after}
                  score_delta={ev.score_delta}
                />
              ))}
            </ul>
            {hasMoreEvents && !showAllEvents && (
              <button
                type="button"
                className="btn-ghost text-sm"
                onClick={() => setShowAllEvents(true)}
              >
                Показать все ({events.length})
              </button>
            )}
          </>
        )}
      </section>

      {/* Ачивки */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Достижения
        </h2>
        {achievements_unlocked.length === 0 ? (
          <p className="card text-sm text-slate-500">Новых достижений нет</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {achievements_unlocked.map((a, i) => (
              <AchievementCard
                key={a.code}
                achievement={{ ...a, unlocked: true }}
                animate
                animationDelayMs={i * 80}
              />
            ))}
          </div>
        )}
      </section>

      {/* Рекомендации */}
      <section className="card space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Рекомендации
        </h2>
        {recommendations.length === 0 ? (
          <p className="text-sm text-slate-500">Рекомендаций нет</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-300">
            {recommendations.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 text-indigo-400" aria-hidden>
                  →
                </span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
