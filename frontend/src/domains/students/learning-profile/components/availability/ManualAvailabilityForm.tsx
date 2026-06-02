import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/utils/cn';
import { DAYS } from '@/domains/students/learning-profile/constants/learningProfileOptions';
import type { Day } from '@/domains/students/learning-profile/types/learningProfile';

/**
 * Manual time form.
 *
 * A student can tick multiple days and add the same time range to all selected
 * days. This is faster than forcing them to repeat the form day by day.
 */
export function ManualAvailabilityForm({
  selectedDays,
  from,
  to,
  onToggleDay,
  onFromChange,
  onToChange,
  onAddTime,
}: {
  selectedDays: Day[];
  from: string;
  to: string;
  onToggleDay: (day: Day) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onAddTime: () => void;
}) {
  return (
    <div className="mt-5 grid gap-4">
      <div>
        <p className="text-sm font-medium text-slate-700">Days</p>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {DAYS.map((day) => {
            const selected = selectedDays.includes(day);

            return (
              <button
                key={day}
                type="button"
                onClick={() => onToggleDay(day)}
                className={cn(
                  'rounded-xl border px-2 py-2 text-sm font-medium transition',
                  selected
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          From
          <input
            type="time"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          To
          <input
            type="time"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950"
          />
        </label>
      </div>

      <Button
        variant="secondary"
        disabled={selectedDays.length === 0}
        onClick={onAddTime}
      >
        Add time
      </Button>
    </div>
  );
}
