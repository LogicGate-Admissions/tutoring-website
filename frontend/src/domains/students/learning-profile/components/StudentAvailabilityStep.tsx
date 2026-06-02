'use client';

/**
 * File purpose: Application source file. Comments explain what this file owns and what should stay elsewhere.
 */

import { useEffect, useMemo, useState } from 'react';
import { HomeLinkButton } from '@/shared/components/HomeLinkButton';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { AvailabilityPresetList } from '@/domains/students/learning-profile/components/availability/AvailabilityPresetList';
import { ManualAvailabilityForm } from '@/domains/students/learning-profile/components/availability/ManualAvailabilityForm';
import { SelectedAvailabilityList } from '@/domains/students/learning-profile/components/availability/SelectedAvailabilityList';
import { StudentAvailabilityGrid } from '@/domains/students/learning-profile/components/StudentAvailabilityGrid';
import { StudentOnboardingSectionBar } from '@/domains/students/learning-profile/components/StudentOnboardingSectionBar';
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
import {
  getStoredLearningProfile,
  updateStoredLearningProfile,
} from '@/domains/students/learning-profile/services/learningProfileStorage';
import type {
  Day,
  TimeBlock,
} from '@/domains/students/learning-profile/types/learningProfile';

/**
 * Final student onboarding step: collect when the student can usually study.
 *
 * The state is deliberately split into two sources:
 * 1. selectedPresetIds: which quick preset cards are active.
 * 2. customBlocks: manual or edited timetable blocks.
 *
 * The UI then derives `availability` by merging both sources. This avoids
 * duplicated storage and makes the grid, badges, and saved profile all show the
 * same final timetable.
 */
export function StudentAvailabilityStep() {
  // Presets stay as IDs so cards can be toggled/highlighted cleanly.
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([]);

  // Manual blocks are the editable blocks the student has added or customised.
  const [customBlocks, setCustomBlocks] = useState<TimeBlock[]>([]);

  // The selected block is used by the grid for keyboard delete and styling.
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);


  useEffect(() => {
    /**
     * Load saved availability from Firestore once the authenticated student is
     * available. The UI stores presets and manual blocks separately, so we
     * split the saved final availability back into those two pieces here.
     */
    let isMounted = true;

    async function loadProfile() {
      const profile = await getStoredLearningProfile();

      if (!isMounted) return;

      setSelectedPresetIds(getInitialSelectedPresetIds(profile.availability));
      setCustomBlocks(profile.availability.filter((block) => block.source === 'manual'));
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // Manual form defaults to one useful after-school slot.
  const [manualDays, setManualDays] = useState<Day[]>(['Mon']);
  const [manualFrom, setManualFrom] = useState('18:00');
  const [manualTo, setManualTo] = useState('19:00');

  // Preset blocks are derived, not stored, so toggling a card is the source of truth.
  const presetBlocks = useMemo(
    () => getPresetBlocks(selectedPresetIds),
    [selectedPresetIds]
  );

  // This is the final timetable shown in the grid, summary, and saved profile.
  const availability = useMemo(
    () => mergeTimeBlocks([...presetBlocks, ...customBlocks]),
    [presetBlocks, customBlocks]
  );

  function togglePreset(presetId: string) {
    setSelectedPresetIds((currentPresetIds) =>
      currentPresetIds.includes(presetId)
        ? currentPresetIds.filter((id) => id !== presetId)
        : [...currentPresetIds, presetId]
    );
  }

  function toggleManualDay(day: Day) {
    setManualDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((item) => item !== day)
        : [...currentDays, day]
    );
  }

  function addManualBlocks() {
    // Invalid form state should not create hidden/zero-length availability.
    if (manualDays.length === 0) return;
    if (timeToMinutes(manualFrom) >= timeToMinutes(manualTo)) return;

    const newManualBlocks = manualDays.map((day) =>
      createManualTimeBlock(day, manualFrom, manualTo)
    );

    setCustomBlocks((currentBlocks) =>
      mergeTimeBlocks([...currentBlocks, ...newManualBlocks])
    );

    setSelectedBlockId(newManualBlocks.at(-1)?.id ?? null);
  }

  function addGridRange(day: Day, from: string, to: string) {
    const newManualBlock = createManualTimeBlock(day, from, to);

    setCustomBlocks((currentBlocks) =>
      mergeTimeBlocks([...currentBlocks, newManualBlock])
    );

    setSelectedBlockId(newManualBlock.id);
  }

  function resizeAvailabilityBlock(blockId: string, from: string, to: string) {
    const blockToResize = availability.find((block) => block.id === blockId);
    if (!blockToResize) return;

    const customBlockToResize = customBlocks.find(
      (block) => block.id === blockId
    );

    // Manual blocks can be edited in-place because they already live in customBlocks.
    if (customBlockToResize) {
      setCustomBlocks((currentBlocks) =>
        mergeTimeBlocks([
          ...currentBlocks.filter((block) => block.id !== blockId),
          { ...customBlockToResize, from, to },
        ])
      );
      return;
    }

    // Preset blocks become manual once resized, otherwise the preset would reappear.
    const nextState = resizePresetAsManualBlock({
      blockToResize,
      from,
      to,
      selectedPresetIds,
      customBlocks,
    });

    setSelectedPresetIds(nextState.selectedPresetIds);
    setCustomBlocks(nextState.customBlocks);
    setSelectedBlockId(nextState.resizedManualBlock.id);
  }

  function removeBlock(blockToRemove: TimeBlock) {
    const nextState = removeVisibleAvailabilityBlock({
      blockToRemove,
      selectedPresetIds,
      customBlocks,
    });

    setSelectedPresetIds(nextState.selectedPresetIds);
    setCustomBlocks(nextState.customBlocks);
    setSelectedBlockId(null);
  }

  function clearAvailability() {
    setSelectedPresetIds([]);
    setCustomBlocks([]);
    setSelectedBlockId(null);
  }

  function saveDraftProfile() {
    void updateStoredLearningProfile({ availability });
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Student onboarding"
        title="When are you usually available?"
        description="Choose common times or add your own."
      />

      <Container className="pt-4">
        <HomeLinkButton />
      </Container>

      <Container className="grid gap-6 py-10 pb-28 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-xl font-semibold">Quick presets</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Presets appear directly on the timetable below, so students can see
            what they have selected.
          </p>

          <AvailabilityPresetList
            selectedPresetIds={selectedPresetIds}
            onTogglePreset={togglePreset}
          />
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Add a manual time</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Pick one or more days, then add the same time block to all of them.
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
          <h2 className="text-xl font-semibold">Timetable selection</h2>
          <p className="mt-2 text-sm text-slate-600">
            Drag across 30-minute slots to add availability, then adjust blocks
            if needed.
          </p>

          <div className="mt-5">
            <StudentAvailabilityGrid
              blocks={availability}
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
            availability={availability}
            onClearAvailability={clearAvailability}
            onRemoveBlock={removeBlock}
          />
        </Card>
      </Container>

      <StudentOnboardingSectionBar
        currentStep="availability"
        onBeforeNavigate={saveDraftProfile}
      />
    </main>
  );
}
