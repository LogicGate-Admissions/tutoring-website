type InfoChoiceButtonProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
  onInfoEnter: () => void;
  onInfoLeave: () => void;
};

export default function InfoChoiceButton({
  label,
  selected,
  onClick,
  onInfoEnter,
  onInfoLeave,
}: InfoChoiceButtonProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        className={`min-h-11 flex-1 rounded-xl border-2 border-slate-950 px-5 py-2.5 text-left text-base font-semibold transition ${
          selected
            ? 'bg-cyan-100 shadow-[3px_3px_0_#0f172a]'
            : 'bg-white hover:bg-slate-50'
        }`}
      >
        {label} {selected && <span aria-hidden="true">✓</span>}
      </button>

      <span
        onMouseEnter={onInfoEnter}
        onMouseLeave={onInfoLeave}
        className="flex h-9 w-9 cursor-help items-center justify-center rounded-full border-2 border-slate-950 bg-white text-sm font-black shadow-[2px_2px_0_#0f172a] transition hover:bg-cyan-50"
        aria-label={`Explain ${label}`}
      >
        i
      </span>
    </div>
  );
}