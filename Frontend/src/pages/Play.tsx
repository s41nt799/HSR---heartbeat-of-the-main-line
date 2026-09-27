import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { NodeView } from '../components/NodeView';
import { StatBar } from '../components/StatBar';
import { TimerBar } from '../components/TimerBar';
import { useSession } from '../hooks/useSession';
import { useTimer } from '../hooks/useTimer';
import { useToast } from '../hooks/useToast';
import type { ChoiceResponse, Effects } from '../types/api';
import { effectsToastType, formatEffectsToast } from '../utils/effectsToast';

function showEffects(show: (m: string, t?: 'success' | 'error' | 'info') => void, effects: Effects) {
  const text = formatEffectsToast(effects);
  if (text === 'Без изменений') return;
  show(text, effectsToastType(effects));
}

export function PlayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  const redirectedRef = useRef(false);
  const timeoutStartedRef = useRef(false);

  const {
    node,
    isLoading,
    error,
    refetch,
    makeChoice,
    isChoosing,
    triggerTimeout,
    isTimingOut,
    finish,
    isFinishing,
  } = useSession(id);

  // Сброс guard таймаута при смене узла
  useEffect(() => {
    timeoutStartedRef.current = false;
  }, [node?.node_key]);

  useEffect(() => {
    if (!node || redirectedRef.current) return;
    if (node.state !== 'active') {
      redirectedRef.current = true;
      navigate(`/sessions/${id}/debrief`, { replace: true });
    }
  }, [node, id, navigate]);

  const handleTimeout = useCallback(async () => {
    if (!id || timeoutStartedRef.current || isTimingOut || isChoosing) return;
    timeoutStartedRef.current = true;
    try {
      const result = await triggerTimeout();
      show('Время вышло', 'error');
      if (result.effects) {
        showEffects(show, result.effects);
      }
      if (result.state === 'failed' || result.state !== 'active') {
        navigate(`/sessions/${id}/debrief`, { replace: true });
        return;
      }
      // Если сервер не применил timeout — разрешаем повтор
      if (!result.timeout_applied) {
        timeoutStartedRef.current = false;
      }
    } catch (err) {
      timeoutStartedRef.current = false;
      show(getErrorMessage(err, 'Не удалось применить таймаут'), 'error');
      void refetch();
    }
  }, [id, isTimingOut, isChoosing, triggerTimeout, show, navigate, refetch]);

  // Critical + deadline уже прошёл — сразу POST /timeout (не ждать тика таймера)
  useEffect(() => {
    if (!node || node.state !== 'active') return;
    if (node.type !== 'critical' || !node.deadline) return;
    const deadlineMs = Date.parse(node.deadline);
    const serverNowMs = Date.parse(node.server_now);
    if (Number.isNaN(deadlineMs) || Number.isNaN(serverNowMs)) return;
    if (deadlineMs <= serverNowMs) {
      void handleTimeout();
    }
  }, [node, handleTimeout]);

  // timer_sec === null → таймер не рендерить
  const showTimer =
    node?.type === 'critical' &&
    node.timer_sec != null &&
    node.deadline != null &&
    node.state === 'active';

  const { remaining_sec, progress } = useTimer(
    showTimer ? node!.deadline : null,
    node?.server_now ?? new Date().toISOString(),
    handleTimeout,
  );

  const handleChoice = async (choiceKey: string) => {
    if (!id || isChoosing || isTimingOut) return;
    if (remaining_sec !== null && remaining_sec <= 0) return;

    try {
      const result: ChoiceResponse = await makeChoice(choiceKey);

      if (result.accepted) {
        showEffects(show, result.effects);
        if (result.speed_bonus > 0) {
          show(`+${result.speed_bonus} за скорость`, 'success');
        }
      } else {
        show('Время вышло', 'error');
        showEffects(show, result.effects);
      }

      if (result.state !== 'active') {
        if (result.state === 'failed') {
          show('Сессия провалена: одна из шкал обнулилась', 'error');
        }
        navigate(`/sessions/${id}/debrief`, { replace: true });
        return;
      }
    } catch (err) {
      show(getErrorMessage(err, 'Не удалось отправить выбор'), 'error');
      void refetch();
    }
  };

  const handleFinish = async () => {
    if (!id || isFinishing) return;
    try {
      await finish();
      navigate(`/sessions/${id}/debrief`, { replace: true });
    } catch (err) {
      show(getErrorMessage(err, 'Не удалось завершить сессию'), 'error');
    }
  };

  if (!id) {
    return (
      <EmptyState
        title="Сессия не найдена"
        description="Некорректный идентификатор сессии."
        actionLabel="К сценариям"
        onAction={() => navigate('/scenarios')}
      />
    );
  }

  if (isLoading) {
    return <LoadingState label="Загрузка узла…" />;
  }

  if (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      return (
        <EmptyState
          title="Сессия не найдена"
          description="Возможно, она удалена или вы перешли по неверной ссылке."
          actionLabel="К сценариям"
          onAction={() => navigate('/scenarios')}
        />
      );
    }
    return (
      <ErrorState
        message={getErrorMessage(error)}
        onRetry={() => {
          show('Повтор запроса…', 'info');
          void refetch();
        }}
      />
    );
  }

  if (!node) {
    return (
      <EmptyState
        title="Нет данных узла"
        actionLabel="Обновить"
        onAction={() => void refetch()}
      />
    );
  }

  if (node.state !== 'active') {
    return <LoadingState label="Переход к дебрифу…" />;
  }

  const busy = isChoosing || isFinishing || isTimingOut;
  const timerExpired = remaining_sec !== null && remaining_sec <= 0;
  const choicesDisabled = busy || node.state !== 'active' || timerExpired;

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
            <StatBar label="Loyalty" value={node.loyalty} color="indigo" />
            <StatBar label="Safety" value={node.safety} color="emerald" />
          </div>
          <div className="rounded-lg bg-amber-500/15 px-3 py-2 text-right">
            <div className="text-xs uppercase tracking-wide text-amber-400/80">Score</div>
            <div className="text-xl font-semibold tabular-nums text-amber-300">
              {node.score}
            </div>
          </div>
        </div>
        {showTimer && <TimerBar remaining={remaining_sec} progress={progress} />}
      </div>

      <div className="card">
        <NodeView
          node={node}
          onChoice={handleChoice}
          choicesDisabled={choicesDisabled}
          onFinish={handleFinish}
          finishDisabled={busy}
        />
      </div>
    </div>
  );
}
