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
import { ScoreBreakdown } from '../components/ScoreBreakdown';
import { useToast } from '../hooks/useToast';
import type { SessionState } from '../types/api';
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
      sessionsApi.create({ scenario_id: scenarioId }),
    onSuccess: (data, scenarioId) => {
      rememberSessionScenario(data.session_id, scenarioId);
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
    final,
    score_breakdown,
    events,
    critical_decisions,
    mistakes,
    unlocked_achievements,
    recommendations,
  } = data;
  const state = final.state as SessionState;
  // TODO: scenario_id из DebriefResponse, когда backend добавит
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
          <FinalCard label="Loyalty" value={final.loyalty} accent="" />
          <FinalCard label="Safety" value={final.safety} accent="" />
          <FinalCard label="Score" value={final.score} accent="border-amber-500/30" />
        </div>
      </section>

      {/* Разбор очков */}
      <section className="card space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Разбор очков
        </h2>
        <ScoreBreakdown
          base={score_breakdown.base}
          speed_bonus={score_breakdown.speed_bonus}
          completion_bonus={score_breakdown.completion_bonus}
          penalty={score_breakdown.penalty}
        />
      </section>

      {/* Критические решения */}
      <section className="card space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Критические решения
        </h2>
        {critical_decisions.length === 0 ? (
          <p className="text-sm text-slate-500">Таймерных узлов не было</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {critical_decisions.map((d, i) => (
              <li
                key={`${d.node_key}-${d.choice_key}-${i}`}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <span className="text-slate-200">{d.node_key}</span>
                  <span className="ml-2 text-slate-500">→ {d.choice_key}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="tabular-nums text-slate-400">
                    осталось {d.time_left_sec} с
                  </span>
                  {d.was_timeout ? (
                    <span className="rounded bg-rose-500/20 px-2 py-0.5 text-rose-300">
                      timeout
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-300">
                      вовремя
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Ошибки */}
      <section className="card space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Что было лучше
        </h2>
        {mistakes.length === 0 ? (
          <p className="text-sm text-slate-500">Критических ошибок не найдено</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-2 pr-3 font-medium">Узел</th>
                  <th className="pb-2 pr-3 font-medium">Ваш выбор</th>
                  <th className="pb-2 font-medium">Рекомендуется</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {mistakes.map((m, i) => (
                  <tr key={`${m.node_key}-${i}`}>
                    <td className="py-2 pr-3 text-slate-300">{m.node_key}</td>
                    <td className="py-2 pr-3 text-rose-300/90">{m.choice_key}</td>
                    <td className="py-2 text-emerald-300/90">{m.recommended_choice_key}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
                  key={`${ev.node_key}-${ev.created_at}-${i}`}
                  node_key={ev.node_key}
                  choice_key={ev.choice_key}
                  event_type={ev.event_type}
                  effects={ev.effects}
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
        {unlocked_achievements.length === 0 ? (
          <p className="card text-sm text-slate-500">Новых достижений нет</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {unlocked_achievements.map((a, i) => (
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
