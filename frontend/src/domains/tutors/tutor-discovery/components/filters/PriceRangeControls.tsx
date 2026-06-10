import {
  MAX_TUTOR_PRICE_PER_HOUR,
  MIN_TUTOR_PRICE_PER_HOUR,
} from '@/domains/tutors/tutor-discovery/constants/tutorProfiles';
import type { Tutor } from '@/domains/tutors/tutor-discovery/types/tutor';

const BUCKET_COUNT = 10;
const BUCKET_WIDTH = (MAX_TUTOR_PRICE_PER_HOUR - MIN_TUTOR_PRICE_PER_HOUR) / BUCKET_COUNT;

function buildBuckets(tutors: Tutor[]) {
  const counts = Array<number>(BUCKET_COUNT).fill(0);
  for (const tutor of tutors) {
    const idx = Math.min(
      Math.floor((tutor.pricePerHour - MIN_TUTOR_PRICE_PER_HOUR) / BUCKET_WIDTH),
      BUCKET_COUNT - 1
    );
    if (idx >= 0) counts[idx]++;
  }
  return counts;
}

function PriceHistogram({
  allTutors,
  minPrice,
  maxPrice,
}: {
  allTutors: Tutor[];
  minPrice: number;
  maxPrice: number;
}) {
  const counts = buildBuckets(allTutors);
  const maxCount = Math.max(...counts, 1);

  return (
    <div>
      <div className="flex h-16 items-end gap-0.5">
        {counts.map((count, i) => {
          const bucketMin = MIN_TUTOR_PRICE_PER_HOUR + i * BUCKET_WIDTH;
          const bucketMax = bucketMin + BUCKET_WIDTH;
          const inRange = bucketMax > minPrice && bucketMin < maxPrice;
          const heightPct = (count / maxCount) * 100;

          return (
            <div
              key={i}
              className="flex flex-1 items-end"
              style={{ height: '100%' }}
            >
              <div
                className={`w-full rounded-t-sm transition-colors ${
                  inRange ? 'bg-slate-950' : 'bg-slate-200'
                }`}
                style={{ height: `${Math.max(heightPct, count > 0 ? 6 : 0)}%` }}
                title={`£${Math.round(bucketMin)}–£${Math.round(bucketMax)}: ${count} tutor${count !== 1 ? 's' : ''}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[0.6rem] text-slate-400">
        <span>£{MIN_TUTOR_PRICE_PER_HOUR}</span>
        <span>£{MAX_TUTOR_PRICE_PER_HOUR}</span>
      </div>
    </div>
  );
}

/**
 * Price controls for the tutor filter panel.
 *
 * When allTutors is provided, renders a histogram above the sliders showing
 * the distribution of tutor prices; bars within the selected range are dark.
 */
export function PriceRangeControls({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  allTutors,
}: {
  minPrice: number;
  maxPrice: number;
  onMinPriceChange: (value: number) => void;
  onMaxPriceChange: (value: number) => void;
  allTutors?: Tutor[];
}) {
  return (
    <div className="grid gap-2 text-sm font-medium text-slate-700">
      {allTutors && allTutors.length > 0 && (
        <PriceHistogram allTutors={allTutors} minPrice={minPrice} maxPrice={maxPrice} />
      )}

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
