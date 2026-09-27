import { memo } from 'react';
import type { NodeResponse } from '../types/api';
import { nodeTypeLabel } from '../utils/format';
import { ChoiceButton } from './ChoiceButton';

interface NodeViewProps {
  node: NodeResponse;
  onChoice: (choiceKey: string) => void;
  choicesDisabled?: boolean;
  onFinish?: () => void;
  finishDisabled?: boolean;
}

function NodeViewComponent({
  node,
  onChoice,
  choicesDisabled = false,
  onFinish,
  finishDisabled = false,
}: NodeViewProps) {
  const isEnding = node.type === 'ending_success' || node.type === 'ending_fail';
  const visibleChoices = (node.choices ?? []).filter((c) => c.is_visible !== false);

  return (
    <div className="space-y-6 animate-[fadeIn_150ms_ease-out]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-indigo-500/20 px-2 py-1 text-xs font-medium text-indigo-300">
          {nodeTypeLabel(node.type)}
        </span>
        <span className="text-xs text-slate-500">{node.node_key}</span>
      </div>

      <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-100 sm:text-lg">
        {node.text}
      </p>

      {isEnding ? (
        <button
          type="button"
          className="btn w-full sm:w-auto"
          onClick={onFinish}
          disabled={finishDisabled || !onFinish}
        >
          Завершить
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          {visibleChoices.length === 0 ? (
            <p className="text-sm text-slate-400">Нет доступных выборов</p>
          ) : (
            visibleChoices.map((choice) => (
              <ChoiceButton
                key={choice.choice_key}
                choice_key={choice.choice_key}
                text={choice.choice_text}
                onClick={onChoice}
                disabled={choicesDisabled}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export const NodeView = memo(NodeViewComponent);