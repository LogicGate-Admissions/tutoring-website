import type { TimeBlock } from '@/domains/students/learning-profile/types/learningProfile';
import { timeToMinutes } from '@/domains/students/learning-profile/utils/timeBlocks';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

// 2-hour slots from 6am to midnight
const SLOT_START = 6;
const SLOT_END = 24;
const SLOT_STEP = 2;

function slotLabel(hour: number) {
  if (hour === 0 || hour === 24) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
}

function slotCovered(blocks: TimeBlock[], day: string, slotHour: number) {
  const slotStart = slotHour * 60;
  const slotEnd = (slotHour + SLOT_STEP) * 60;
  return blocks.some((block) => {
    if (block.day !== day) return false;
    const start = timeToMinutes(block.from);
    const end = timeToMinutes(block.to === '24:00' ? '23:59' : block.to);
    return start < slotEnd && end > slotStart;
  });
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${display}${suffix}` : `${display}:${String(m).padStart(2, '0')}${suffix}`;
}

function dayBlocks(blocks: TimeBlock[], day: string) {
  return blocks
    .filter((b) => b.day === day)
    .sort((a, b) => timeToMinutes(a.from) - timeToMinutes(b.from));
}

type TutorAvailabilityDisplayProps = {
  availabilityBlocks: TimeBlock[];
  fallbackText: string;
};

export function TutorAvailabilityDisplay({
  availabilityBlocks,
  fallbackText,
}: TutorAvailabilityDisplayProps) {
  if (availabilityBlocks.length === 0) {
    return <p className="text-sm leading-6 text-slate-700">{fallbackText}</p>;
  }

  const hours: number[] = [];
  for (let h = SLOT_START; h < SLOT_END; h += SLOT_STEP) {
    hours.push(h);
  }

  const daysWithBlocks = DAYS.filter((d) => dayBlocks(availabilityBlocks, d).length > 0);

  return (
    <div className="grid gap-4">
      {/* Visual grid */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[300px] border-collapse">
          <thead>
            <tr>
              <th className="w-12 pb-1" />
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="pb-1 text-center text-[0.65rem] font-semibold text-slate-500"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour) => (
              <tr key={hour}>
                <td className="pr-2 text-right text-[0.6rem] font-medium leading-none text-slate-400 align-middle">
                  {slotLabel(hour)}
                </td>
                {DAYS.map((day) => {
                  const active = slotCovered(availabilityBlocks, day, hour);
                  return (
                    <td key={day} className="p-px">
                      <div
                        className={`h-4 w-full rounded-sm transition-colors ${
                          active ? 'bg-slate-950' : 'bg-slate-100'
                        }`}
                        title={
                          active
                            ? `${day} ${slotLabel(hour)}–${slotLabel(hour + SLOT_STEP)}`
                            : undefined
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Exact times per day */}
      {daysWithBlocks.length > 0 && (
        <div className="grid gap-1">
          {daysWithBlocks.map((day) => {
            const blocks = dayBlocks(availabilityBlocks, day);
            return (
              <div key={day} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
                <span className="w-7 font-semibold text-slate-700">{day}</span>
                <span className="text-slate-500">
                  {blocks.map((b) => `${formatTime(b.from)} – ${formatTime(b.to)}`).join(', ')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
