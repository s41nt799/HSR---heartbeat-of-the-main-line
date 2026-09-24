import { useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { NodeView } from '../components/NodeView';
import { StatBar } from '../components/StatBar';
import { useSession } from '../hooks/useSession';
import { useToast } from '../store/toastStore';

export function PlayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  const redirectedRef = useRef(false);

  const {
    node,
    isLoading,
    error,
    refetch,
    makeChoice,
    isChoosing,
    finish,
    isFinishing,
  } = useSession(id);

  useEffect(() => {
    if (!node || redirectedRef.current) return;
    if (node.state === 'failed') {
      redirectedRef.current = true;
      navigate(`/sessions/${id}/debrief`, { replace: true });
    }
  }, [node, id, navigate]);

  const handleChoice = async (choiceKey: string) => {
    if (!id || isChoosing) return;
    try {
      const result = await makeChoice(choiceKey);
      if (result.state === 'failed') {
        show('Сессия провалена: одна из шкал обнулилась', 'error');
        navigate(`/sessions/${id}/debrief`, { replace: true });
        return;
      }
      if (!result.accepted) {
        show('Время вышло', 'error');
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
        onRetry={() => void refetch()}
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

  if (node.state === 'failed') {
    return (
      <div className="card space-y-4 text-center">
        <h1 className="text-xl font-semibold text-rose-300">Провал</h1>
        <p className="text-sm text-slate-400">
          Одна из шкал достигла нуля. Разберите решения в дебрифе.
        </p>
        <Link to={`/sessions/${id}/debrief`} className="btn inline-flex">
          Дебриф
        </Link>
      </div>
    );
  }

  const busy = isChoosing || isFinishing;

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
      </div>

      <div className="card">
        <NodeView
          node={node}
          onChoice={handleChoice}
          choicesDisabled={busy || node.state !== 'active'}
          onFinish={handleFinish}
          finishDisabled={busy}
        />
      </div>
    </div>
  );
}
