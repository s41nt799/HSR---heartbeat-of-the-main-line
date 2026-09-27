import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
import type { SessionResponse } from '../types/api';
import { effectsToastType, formatEffectsToast } from '../utils/effectsToast';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function showDeltas(
  show: (m: string, t?: 'success' | 'error' | 'info') => void,
  loyaltyDelta: number,
  safetyDelta: number,
  scoreDelta: number,
) {
  const asEffects = { loyalty: loyaltyDelta, safety: safetyDelta, points: scoreDelta };
  const text = formatEffectsToast(asEffects);
  if (text === 'Без изменений') return;
  show(text, effectsToastType(asEffects));
}

export function PlayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { show } = useToast();
  const redirectedRef = useRef(false);
  const timeoutStartedRef = useRef(false);

  // Начальные шкалы приходят из POST /sessions/start (location.state)
  const initialSession = (location.state as { session?: SessionResponse } | null)?.session;

  const [loyalty, setLoyalty] = useState(initialSession?.loyalty ?? 100);
  const [safety, setSafety] = useState(initialSession?.safety ?? 100);
  const [score, setScore] = useState(initialSession?.score ?? 0);

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

  const goDebrief = useCallback(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    navigate(`/sessions/${id}/debrief`, { replace: true, state: { session: initialSession } });
  }, [id, navigate, initialSession]);

  // 409 от GET /node — сессия уже не активна
  useEffect(() => {
    if (!error) return;
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 409 || status === 404) {
      // 404 — сессии нет, 409 — не активна
      goDebrief();
    }
  }, [error, goDebrief]);

  const handleTimeout = useCallback(async () => {
    if (!id || timeoutStartedRef.current || isTimingOut || isChoosing) return;
    timeoutStartedRef.current = true;
    try {
      const result = await triggerTimeout();
      show('Время вышло', 'error');
      showDeltas(show, result.loyalty_delta, result.safety_delta, result.score_delta);
      setLoyalty((v) => clamp(v + result.loyalty_delta, 0, 100));
      setSafety((v) => clamp(v + result.safety_delta, 0, 100));
      setScore((v) => Math.max(0, v + result.score_delta));

      if (result.new_state !== 'active') {
        goDebrief();
        return;
      }
      // если сервер не применил (например, дедлайн ещё не прошёл) — разрешаем повтор
      if (result.new_state === 'active') {
        // refetch вернёт актуальный узел
        void refetch();
      }
    } catch (err) {
      timeoutStartedRef.current = false;
      show(getErrorMessage(err, 'Не удалось применить таймаут'), 'error');
      void refetch();
    }
  }, [id, isTimingOut, isChoosing, triggerTimeout, show, goDebrief, refetch]);

  // Таймер активен, если critical + timer_left_sec > 0
  const showTimer =
    node?.type === 'critical' &&
    node.timer_left_sec != null &&
    node.timer_left_sec > 0;

  const { remaining_sec, progress } = useTimer(
    showTimer ? node!.timer_left_sec : null,
    handleTimeout,
  );

  const handleChoice = async (choiceKey: string) => {
    if (!id || isChoosing || isTimingOut) return;
    if (remaining_sec !== null && remaining_sec <= 0) return;

    try {
      const result = await makeChoice(choiceKey);
      showDeltas(show, result.loyalty_delta, result.safety_delta, result.score_delta);
      setLoyalty((v) => clamp(v + result.loyalty_delta, 0, 100));
      setSafety((v) => clamp(v + result.safety_delta, 0, 100));
      setScore((v) => Math.max(0, v + result.score_delta));

      if (result.new_state !== 'active') {
        if (result.new_state === 'failed') {
          show('Сессия провалена: одна из шкал обнулилась', 'error');
        }
        goDebrief();
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
      goDebrief();
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
    if (status === 409) {
      return <LoadingState label="Переход к дебрифу…" />;
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

  const busy = isChoosing || isFinishing || isTimingOut;
  const timerExpired = remaining_sec !== null && remaining_sec <= 0;
  const choicesDisabled = busy || timerExpired;
  
  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
            <StatBar label="Loyalty" value={loyalty} color="indigo" />
            <StatBar label="Safety" value={safety} color="emerald" />
          </div>
          <div className="rounded-lg bg-amber-500/15 px-3 py-2 text-right">
            <div className="text-xs uppercase tracking-wide text-amber-400/80">Score</div>
            <div className="text-xl font-semibold tabular-nums text-amber-300">
              {score}
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