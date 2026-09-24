interface ChoiceButtonProps {
  choice_key: string;
  text: string;
  onClick: (choiceKey: string) => void;
  disabled?: boolean;
}

export function ChoiceButton({
  choice_key,
  text,
  onClick,
  disabled = false,
}: ChoiceButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(choice_key)}
      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-left
        text-sm text-slate-100 transition-colors duration-150
        hover:border-indigo-500 hover:bg-slate-800
        disabled:cursor-not-allowed disabled:opacity-50"
    >
      {text}
    </button>
  );
}
