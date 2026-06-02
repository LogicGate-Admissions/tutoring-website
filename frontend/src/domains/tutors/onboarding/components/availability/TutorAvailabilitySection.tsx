/**
 * File purpose: Tutor availability section.
 *
 * This mirrors the student availability experience but writes into a tutor
 * profile. The section owns only availability UI; the parent decides when to
 * save the final profile to Firestore.
 */

import { useMemo, useState } from 'react';
import { Card } from '@/shared/components/Card';
import { AvailabilityPresetList } from '@/domains/students/learning-profile/components/availability/AvailabilityPresetList';
import { ManualAvailabilityForm } from '@/domains/students/learning-profile/components/availability/ManualAvailabilityForm';
import { SelectedAvailabilityList } from '@/domains/students/learning-profile/components/availability/SelectedAvailabilityList';
import { StudentAvailabilityGrid } from '@/domains/students/learning-profile/components/StudentAvailabilityGrid';
import {
  createManualTimeBlock,
  mergeTimeBlocks,
  timeToMinutes,
} from '@/domains/students/learning-profile/utils/timeBlocks';
import {
  getInitialSelectedPresetIds,
  getPresetBlocks,
  removeVisibleAvailabilityBlock,
  resizePresetAsManualBlock,
} from '@/domains/students/learning-profile/utils/availabilitySelection';
import type {
  Day,
  TimeBlock,
} from '@/domains/students/learning-profile/types/learningProfile';

type TutorAvailabilitySectionProps = {
  /** Final merged tutor availability stored in the tutor onboarding draft. */
  availability: TimeBlock[];

  /** Pushes the updated final availability back into the parent draft. */
  onChangeAvailability: (availability: TimeBlock[]) => void;
};

/**
 * Tutor availability editor.
 *
 * The component keeps preset/manual editing state locally, but every meaningful
 * change calls `onChangeAvailability` with the merged timetable. This gives the
 * parent one simple source of truth to submit to Firestore.
 */
export function TutorAvailabilitySection({
  availability,
  onChangeAvailability,
}: TutorAvailabilitySectionProps) {
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>(() =>
    getInitialSelectedPresetIds(availability)
  );

  const [customBlocks, setCustomBlocks] = useState<TimeBlock[]>(() =>
    availability.filter((block) => block.source === 'manual')
  );

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [manualDays, setManualDays] = useState<Day[]>(['Mon']);
  const [manualFrom, setManualFrom] = useState('18:00');
  const [manualTo, setManualTo] = useState('19:00');

  const presetBlocks = useMemo(
    () => getPresetBlocks(selectedPresetIds),
    [selectedPresetIds]
  );

  const mergedAvailability = useMemo(
    () => mergeTimeBlocks([...presetBlocks, ...customBlocks]),
    [presetBlocks, customBlocks]
  );

  function commitAvailability(nextPresetIds: string[], nextCustomBlocks: TimeBlock[]) {
    const nextAvailability = mergeTimeBlocks([
      ...getPresetBlocks(nextPresetIds),
      ...nextCustomBlocks,
    ]);

    setSelectedPresetIds(nextPresetIds);
    setCustomBlocks(nextCustomBlocks);
    onChangeAvailability(nextAvailability);
  }

  function togglePreset(presetId: string) {
    const nextPresetIds = selectedPresetIds.includes(presetId)
      ? selectedPresetIds.filter((id) => id !== presetId)
      : [...selectedPresetIds, presetId];

    commitAvailability(nextPresetIds, customBlocks);
  }

  function toggleManualDay(day: Day) {
    setManualDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((item) => item !== day)
        : [...currentDays, day]
    );
  }

  function addManualBlocks() {
    if (manualDays.length === 0) return;
    if (timeToMinutes(manualFrom) >= timeToMinutes(manualTo)) return;

    const newManualBlocks = manualDays.map((day) =>
      createManualTimeBlock(day, manualFrom, manualTo)
    );

    const nextCustomBlocks = mergeTimeBlocks([...customBlocks, ...newManualBlocks]);

    commitAvailability(selectedPresetIds, nextCustomBlocks);
    setSelectedBlockId(newManualBlocks.at(-1)?.id ?? null);
  }

  function addGridRange(day: Day, from: string, to: string) {
    const newManualBlock = createManualTimeBlock(day, from, to);
    const nextCustomBlocks = mergeTimeBlocks([...customBlocks, newManualBlock]);

    commitAvailability(selectedPresetIds, nextCustomBlocks);
    setSelectedBlockId(newManualBlock.id);
  }

  function resizeAvailabilityBlock(blockId: string, from: string, to: string) {
    const blockToResize = mergedAvailability.find((block) => block.id === blockId);
    if (!blockToResize) return;

    const customBlockToResize = customBlocks.find((block) => block.id === blockId);

    if (customBlockToResize) {
      const nextCustomBlocks = mergeTimeBlocks([
        ...customBlocks.filter((block) => block.id !== blockId),
        { ...customBlockToResize, from, to },
      ]);

      commitAvailability(selectedPresetIds, nextCustomBlocks);
      return;
    }

    const nextState = resizePresetAsManualBlock({
      blockToResize,
      from,
      to,
      selectedPresetIds,
      customBlocks,
    });

    commitAvailability(nextState.selectedPresetIds, nextState.customBlocks);
    setSelectedBlockId(nextState.resizedManualBlock.id);
  }

  function removeBlock(blockToRemove: TimeBlock) {
    const nextState = removeVisibleAvailabilityBlock({
      blockToRemove,
      selectedPresetIds,
      customBlocks,
    });

    commitAvailability(nextState.selectedPresetIds, nextState.customBlocks);
    setSelectedBlockId(null);
  }

  function clearAvailability() {
    commitAvailability([], []);
    setSelectedBlockId(null);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <h2 className="text-xl font-semibold">Availability presets</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Choose common teaching times. Presets appear directly on the timetable
          and can still be edited afterwards.
        </p>

        <AvailabilityPresetList
          selectedPresetIds={selectedPresetIds}
          onTogglePreset={togglePreset}
        />
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Add a manual time</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Tick one or more days, then add the same teaching window to each day.
        </p>

        <ManualAvailabilityForm
          selectedDays={manualDays}
          from={manualFrom}
          to={manualTo}
          onToggleDay={toggleManualDay}
          onFromChange={setManualFrom}
          onToChange={setManualTo}
          onAddTime={addManualBlocks}
        />
      </Card>

      <Card className="lg:col-span-2">
        <h2 className="text-xl font-semibold">Teaching timetable</h2>
        <p className="mt-2 text-sm text-slate-600">
          Drag to create blocks, resize blocks from the top or bottom edge, and
          press Backspace/Delete after selecting a block to remove it.
        </p>

        <div className="mt-5">
          <StudentAvailabilityGrid
            blocks={mergedAvailability}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onAddTimeRange={addGridRange}
            onDeleteBlock={removeBlock}
            onResizeBlock={resizeAvailabilityBlock}
          />
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <SelectedAvailabilityList
          availability={mergedAvailability}
          onClearAvailability={clearAvailability}
          onRemoveBlock={removeBlock}
        />
      </Card>
    </section>
  );
}
