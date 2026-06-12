import { useRef, useState } from "react";
import { MIN_TUTOR_PRICE_PER_HOUR } from "@/domains/tutors/tutor-discovery/constants/tutorProfiles";
import type { Tutor } from "@/domains/tutors/tutor-discovery/types/tutor";
import { cn } from "@/shared/utils/cn";

const BUCKET_COUNT = 14;
const PRICE_STEP = 5;

type ActiveHandle = "min" | "max";
type DraftPrice = {
  sourceValue: number;
  text: string;
};

function roundUpToStep(value: number, step = PRICE_STEP) {
  return Math.ceil(value / step) * step;
}

function getDynamicMaxPrice(tutors: Tutor[] | undefined) {
  const highestTutorPrice = Math.max(
    MIN_TUTOR_PRICE_PER_HOUR,
    ...(tutors ?? []).map((tutor) => tutor.pricePerHour),
  );

  return Math.max(100, roundUpToStep(highestTutorPrice));
}

function buildBuckets(tutors: Tutor[], maxPrice: number) {
  const counts = Array<number>(BUCKET_COUNT).fill(0);
  const bucketWidth = (maxPrice - MIN_TUTOR_PRICE_PER_HOUR) / BUCKET_COUNT;

  for (const tutor of tutors) {
    const index = Math.min(
      Math.floor((tutor.pricePerHour - MIN_TUTOR_PRICE_PER_HOUR) / bucketWidth),
      BUCKET_COUNT - 1,
    );

    if (index >= 0) counts[index] += 1;
  }

  return { counts, bucketWidth };
}

function priceToPercent(value: number, maxPrice: number) {
  return (
    ((value - MIN_TUTOR_PRICE_PER_HOUR) /
      (maxPrice - MIN_TUTOR_PRICE_PER_HOUR)) *
    100
  );
}

function percentToPrice(percent: number, maxPrice: number) {
  const rawPrice =
    MIN_TUTOR_PRICE_PER_HOUR +
    (percent / 100) * (maxPrice - MIN_TUTOR_PRICE_PER_HOUR);

  return Math.round(rawPrice / PRICE_STEP) * PRICE_STEP;
}

function clampPrice(value: number, maxPrice: number) {
  return Math.min(Math.max(value, MIN_TUTOR_PRICE_PER_HOUR), maxPrice);
}

function cleanPriceInput(rawValue: string) {
  const onlyNumbersAndDot = rawValue.replace(/[^\d.]/g, "");
  const [rawWhole = "", ...rest] = onlyNumbersAndDot.split(".");
  const hasDot = onlyNumbersAndDot.includes(".");
  const rawDecimal = rest.join("");

  const wholeWithoutLeadingZeros = rawWhole.replace(/^0+(?=\d)/, "") || "0";
  const decimal = rawDecimal.slice(0, 2);

  if (hasDot) {
    return `${wholeWithoutLeadingZeros}.${decimal}`;
  }

  return wholeWithoutLeadingZeros;
}

function priceInputToNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function draftValue(draft: DraftPrice | null, currentValue: number) {
  return draft?.sourceValue === currentValue ? draft.text : String(currentValue);
}

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
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    handle: ActiveHandle | null;
  } | null>(null);

  const [activeHandle, setActiveHandle] = useState<ActiveHandle | null>(null);
  const [minDraft, setMinDraft] = useState<DraftPrice | null>(null);
  const [maxDraft, setMaxDraft] = useState<DraftPrice | null>(null);

  const dynamicMaxPrice = getDynamicMaxPrice(allTutors);

  const { counts, bucketWidth } =
    allTutors && allTutors.length > 0
      ? buildBuckets(allTutors, dynamicMaxPrice)
      : { counts: [], bucketWidth: 0 };

  const safeMinPrice = clampPrice(minPrice, dynamicMaxPrice);
  const safeMaxPrice = clampPrice(maxPrice, dynamicMaxPrice);
  const maxCount = Math.max(...counts, 1);

  const minInputValue = draftValue(minDraft, safeMinPrice);
  const maxInputValue = draftValue(maxDraft, safeMaxPrice);

  const selectedLeft = priceToPercent(safeMinPrice, dynamicMaxPrice);
  const selectedRight = 100 - priceToPercent(safeMaxPrice, dynamicMaxPrice);
  const handlesOverlap = safeMinPrice === safeMaxPrice;

  function updateMin(value: number) {
    const nextValue = Math.min(clampPrice(value, dynamicMaxPrice), safeMaxPrice);
    setMinDraft(null);
    onMinPriceChange(nextValue);
  }

  function updateMax(value: number) {
    const nextValue = Math.max(clampPrice(value, dynamicMaxPrice), safeMinPrice);
    setMaxDraft(null);
    onMaxPriceChange(nextValue);
  }

  function priceFromPointer(clientX: number) {
    const track = trackRef.current;
    if (!track) return safeMinPrice;

    const rect = track.getBoundingClientRect();
    const percent = Math.min(
      Math.max(((clientX - rect.left) / rect.width) * 100, 0),
      100,
    );

    return clampPrice(percentToPrice(percent, dynamicMaxPrice), dynamicMaxPrice);
  }

  function nearestHandle(clientX: number): ActiveHandle {
    const pointerPrice = priceFromPointer(clientX);
    const minDistance = Math.abs(pointerPrice - safeMinPrice);
    const maxDistance = Math.abs(pointerPrice - safeMaxPrice);

    return minDistance <= maxDistance ? "min" : "max";
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      handle: handlesOverlap ? null : nearestHandle(event.clientX),
    };

    setActiveHandle(dragRef.current.handle);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function continueDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (!drag.handle && handlesOverlap) {
      const deltaX = event.clientX - drag.startX;

      if (Math.abs(deltaX) < 2) return;

      drag.handle = deltaX > 0 ? "max" : "min";
      setActiveHandle(drag.handle);
    }

    if (!drag.handle) return;

    const nextPrice = priceFromPointer(event.clientX);

    if (drag.handle === "min") {
      updateMin(nextPrice);
    } else {
      updateMax(nextPrice);
    }
  }

  function stopDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;

    if (drag?.pointerId === event.pointerId) {
      dragRef.current = null;
      setActiveHandle(null);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  }

  function handleMinInputChange(rawValue: string) {
    const cleanedValue = cleanPriceInput(rawValue);
    const numericValue = priceInputToNumber(cleanedValue);

    if (numericValue === null) {
      setMinDraft({ sourceValue: safeMinPrice, text: cleanedValue });
      return;
    }

    const nextValue = Math.min(
      clampPrice(numericValue, dynamicMaxPrice),
      safeMaxPrice,
    );

    setMinDraft({ sourceValue: nextValue, text: cleanedValue });
    onMinPriceChange(nextValue);
  }

  function handleMaxInputChange(rawValue: string) {
    const cleanedValue = cleanPriceInput(rawValue);
    const numericValue = priceInputToNumber(cleanedValue);

    if (numericValue === null) {
      setMaxDraft({ sourceValue: safeMaxPrice, text: cleanedValue });
      return;
    }

    const nextValue = Math.max(
      clampPrice(numericValue, dynamicMaxPrice),
      safeMinPrice,
    );

    setMaxDraft({ sourceValue: nextValue, text: cleanedValue });
    onMaxPriceChange(nextValue);
  }

  function normaliseMinInput() {
    const numericValue = priceInputToNumber(minInputValue);

    if (numericValue === null) {
      setMinDraft(null);
      return;
    }

    const nextValue = Math.min(
      clampPrice(Number(numericValue.toFixed(2)), dynamicMaxPrice),
      safeMaxPrice,
    );

    setMinDraft(null);
    onMinPriceChange(nextValue);
  }

  function normaliseMaxInput() {
    const numericValue = priceInputToNumber(maxInputValue);

    if (numericValue === null) {
      setMaxDraft(null);
      return;
    }

    const nextValue = Math.max(
      clampPrice(Number(numericValue.toFixed(2)), dynamicMaxPrice),
      safeMinPrice,
    );

    setMaxDraft(null);
    onMaxPriceChange(nextValue);
  }

  return (
    <div className="grid gap-3 text-sm font-medium text-slate-700">
      <div className="flex items-center justify-between gap-3">
        <span>Hourly rate</span>
        <span className="font-semibold text-slate-950">
          £{safeMinPrice} - £{safeMaxPrice}
        </span>
      </div>

      <div className="relative pt-1">
        <div className="flex h-16 items-end gap-0.5 px-1">
          {counts.map((count, index) => {
            const bucketMin = MIN_TUTOR_PRICE_PER_HOUR + index * bucketWidth;
            const bucketMax = bucketMin + bucketWidth;
            const isSelected =
              bucketMax > safeMinPrice && bucketMin < safeMaxPrice;

            return (
              <div key={index} className="flex h-full flex-1 items-end">
                <div
                  className={cn(
                    "w-full rounded-t-sm",
                    isSelected ? "bg-slate-950" : "bg-slate-200",
                  )}
                  style={{
                    height: `${Math.max(
                      (count / maxCount) * 100,
                      count > 0 ? 8 : 3,
                    )}%`,
                  }}
                  title={`£${Math.round(bucketMin)} - £${Math.round(
                    bucketMax,
                  )}: ${count} tutor${count === 1 ? "" : "s"}`}
                />
              </div>
            );
          })}
        </div>

        <div
          ref={trackRef}
          role="slider"
          aria-label="Hourly rate range"
          aria-valuemin={MIN_TUTOR_PRICE_PER_HOUR}
          aria-valuemax={dynamicMaxPrice}
          aria-valuenow={safeMaxPrice}
          aria-valuetext={`£${safeMinPrice} to £${safeMaxPrice}`}
          tabIndex={0}
          onPointerDown={startDrag}
          onPointerMove={continueDrag}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          onLostPointerCapture={() => {
            dragRef.current = null;
            setActiveHandle(null);
          }}
          className="relative mt-2 h-6 cursor-pointer touch-none select-none"
        >
          <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-200" />

          <div
            className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-950"
            style={{ left: `${selectedLeft}%`, right: `${selectedRight}%` }}
          />

          <div
            className={cn(
              "pointer-events-none absolute z-20 h-5 w-5 rounded-full border-2 border-white bg-slate-950 shadow transition-transform",
              activeHandle === "min" && "scale-110",
            )}
            style={{
              left: `${selectedLeft}%`,
              top: "50%",
              transform:
                handlesOverlap && activeHandle !== "max"
                  ? "translate(-70%, -50%)"
                  : "translate(-50%, -50%)",
            }}
          />

          <div
            className={cn(
              "pointer-events-none absolute z-30 h-5 w-5 rounded-full border-2 border-white bg-slate-950 shadow transition-transform",
              activeHandle === "max" && "scale-110",
            )}
            style={{
              left: `${100 - selectedRight}%`,
              top: "50%",
              transform:
                handlesOverlap && activeHandle !== "min"
                  ? "translate(-30%, -50%)"
                  : "translate(-50%, -50%)",
            }}
          />
        </div>

        <div className="mt-1 flex justify-between text-[0.65rem] text-slate-400">
          <span>£{MIN_TUTOR_PRICE_PER_HOUR}</span>
          <span>£{dynamicMaxPrice}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <PriceNumberField
          label="Min"
          value={minInputValue}
          maxPrice={dynamicMaxPrice}
          onChange={handleMinInputChange}
          onBlur={normaliseMinInput}
        />
        <PriceNumberField
          label="Max"
          value={maxInputValue}
          maxPrice={dynamicMaxPrice}
          onChange={handleMaxInputChange}
          onBlur={normaliseMaxInput}
        />
      </div>
    </div>
  );
}

function PriceNumberField({
  label,
  value,
  maxPrice,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  maxPrice: number;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  return (
    <label className="grid gap-1 text-xs text-slate-500">
      <span>{label}</span>
      <input
        type="text"
        inputMode="decimal"
        min={MIN_TUTOR_PRICE_PER_HOUR}
        max={maxPrice}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}
