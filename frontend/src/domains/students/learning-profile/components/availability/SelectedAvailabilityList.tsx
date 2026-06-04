/**
 * File purpose: Small availability UI building block. It keeps StudentAvailabilityStep readable.
 */

import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { timeBlockLabel } from '@/domains/students/learning-profile/utils/timeBlocks';
import type { TimeBlock } from '@/domains/students/learning-profile/types/learningProfile';

/**
 * Bottom summary of the final merged availability.
 *
 * Clicking a badge removes the same visible block shown on the grid, so the
 * summary and timetable behave consistently.
 */
export function SelectedAvailabilityList({
  availability,
  onClearAvailability,
  onRemoveBlock,
}: {
  availability: TimeBlock[];
  onClearAvailability: () => void;
  onRemoveBlock: (block: TimeBlock) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Selected availability</h2>
          <p className="mt-2 text-sm text-slate-600">
            These times will be used when you request a match.
          </p>
        </div>

        <Button
          variant="ghost"
          disabled={availability.length === 0}
          onClick={onClearAvailability}
          className="w-fit px-4 py-2"
        >
          Clear
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {availability.length === 0 && (
          <p className="text-sm text-slate-500">No times selected yet.</p>
        )}

        {availability.map((block) => (
          <button
            key={block.id}
            type="button"
            onClick={() => onRemoveBlock(block)}
          >
            <Badge className="hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">
              {timeBlockLabel(block)} ×
            </Badge>
          </button>
        ))}
      </div>
    </>
  );
}
