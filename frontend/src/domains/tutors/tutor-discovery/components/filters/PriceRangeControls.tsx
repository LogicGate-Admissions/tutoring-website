import {
  MAX_TUTOR_PRICE_PER_HOUR,
  MIN_TUTOR_PRICE_PER_HOUR,
} from '@/domains/tutors/tutor-discovery/constants/tutorProfiles';

/**
 * Price controls for the tutor filter panel.
 *
 * The slider and number input update the same value so users can either drag
 * quickly or type an exact hourly rate.
 */
export function PriceRangeControls({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
}: {
  minPrice: number;
  maxPrice: number;
  onMinPriceChange: (value: number) => void;
  onMaxPriceChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-2 text-sm font-medium text-slate-700">
      <PriceField
        label="Min hourly rate"
        value={minPrice}
        onChange={onMinPriceChange}
      />

      <PriceField
        label="Max hourly rate"
        value={maxPrice}
        onChange={onMaxPriceChange}
        className="mt-3"
      />
    </div>
  );
}

function PriceField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="font-semibold text-slate-950">£{value}</span>
      </div>

      <input
        type="range"
        min={MIN_TUTOR_PRICE_PER_HOUR}
        max={MAX_TUTOR_PRICE_PER_HOUR}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-slate-950"
      />

      <input
        type="number"
        min={MIN_TUTOR_PRICE_PER_HOUR}
        max={MAX_TUTOR_PRICE_PER_HOUR}
        value={value}
        onChange={(event) => {
          const typedValue = Number(event.target.value);
          onChange(Number.isNaN(typedValue) ? value : typedValue);
        }}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
      />
    </div>
  );
}
