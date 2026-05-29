type ChoiceButtonProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
};

export default function ChoiceButton({
  label,
  selected,
  onClick,
  className = '',
}: ChoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-xl border-2 border-slate-950 px-5 py-2.5 text-base font-semibold transition ${
        selected
          ? 'bg-cyan-100 shadow-[3px_3px_0_#0f172a]'
          : 'bg-white hover:bg-slate-50'
      } ${className}`}
    >
      {label} {selected && <span aria-hidden="true">✓</span>}
    </button>
  );
}