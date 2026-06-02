'use client';

import { useMemo, useState } from 'react';
import { HomeLinkButton } from '@/shared/components/HomeLinkButton';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { cn } from '@/shared/utils/cn';
import { OptionCard } from '@/domains/students/learning-profile/components/OptionCard';
import { StudentAvailabilityGrid } from '@/domains/students/learning-profile/components/StudentAvailabilityGrid';
import { StudentOnboardingSectionBar } from '@/domains/students/learning-profile/components/StudentOnboardingSectionBar';
import {
  AVAILABILITY_PRESETS,
  DAYS,
} from '@/domains/students/learning-profile/constants/learningProfileOptions';
import {
  blockFullyContains,
  blockTouchesOrOverlaps,
  createManualTimeBlock,
  mergeTimeBlocks,
  timeBlockLabel,
  timeToMinutes,
} from '@/domains/students/learning-profile/utils/timeBlocks';
import {
  getStoredLearningProfile,
  updateStoredLearningProfile,
} from '@/domains/students/learning-profile/services/learningProfileStorage';
import type {
  Day,
  TimeBlock,
} from '@/domains/students/learning-profile/types/learningProfile';

function blockCoversBlock(savedBlock: TimeBlock, targetBlock: TimeBlock) {
  if (savedBlock.day !== targetBlock.day) return false;

  return (
    timeToMinutes(savedBlock.from) <= timeToMinutes(targetBlock.from) &&
    timeToMinutes(savedBlock.to) >= timeToMinutes(targetBlock.to)
  );
}

function getInitialSelectedPresetIds(savedAvailability: TimeBlock[]) {
  return AVAILABILITY_PRESETS.filter((preset) =>
    preset.blocks.every((presetBlock) =>
      savedAvailability.some((savedBlock) =>
        blockCoversBlock(savedBlock, presetBlock)
      )
    )
  ).map((preset) => preset.id);
}

/**
 * Final student onboarding step.
 *
 * Presets and manual times are kept as separate pieces of state so preset
 * cards can stay highlighted while the saved availability remains a clean,
 * merged list of blocks.
 */
export function StudentAvailabilityStep() {
  const storedProfile = getStoredLearningProfile();

  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>(
    getInitialSelectedPresetIds(storedProfile.availability)
  );

  const [customBlocks, setCustomBlocks] = useState<TimeBlock[]>(
    storedProfile.availability.filter((block) => block.source === 'manual')
  );

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [manualDays, setManualDays] = useState<Day[]>(['Mon']);
  const [manualFrom, setManualFrom] = useState('18:00');
  const [manualTo, setManualTo] = useState('19:00');

  const presetBlocks = useMemo(() => {
    return AVAILABILITY_PRESETS.filter((preset) =>
      selectedPresetIds.includes(preset.id)
    ).flatMap((preset) => preset.blocks);
  }, [selectedPresetIds]);

  const availability = useMemo(() => {
    return mergeTimeBlocks([...presetBlocks, ...customBlocks]);
  }, [presetBlocks, customBlocks]);

  function togglePreset(presetId: string) {
    setSelectedPresetIds((currentPresetIds) => {
      if (currentPresetIds.includes(presetId)) {
        return currentPresetIds.filter((id) => id !== presetId);
      }

      return [...currentPresetIds, presetId];
    });
  }

  function toggleManualDay(day: Day) {
    setManualDays((currentDays) => {
      if (currentDays.includes(day)) {
        return currentDays.filter((item) => item !== day);
      }

      return [...currentDays, day];
    });
  }

  function addManualBlocks() {
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

    /**
     * Normal manual block resize:
     * update the existing manual block.
     */
    if (customBlockToResize) {
      setCustomBlocks((currentBlocks) => {
        const resizedBlock: TimeBlock = {
          ...customBlockToResize,
          from,
          to,
        };

        const otherBlocks = currentBlocks.filter(
          (block) => block.id !== blockId
        );

        return mergeTimeBlocks([...otherBlocks, resizedBlock]);
      });

      return;
    }

    /**
     * Preset block resize:
     * convert the resized preset into a manual block.
     *
     * This is important because a preset is generated from the preset card.
     * Once the user edits it manually, it should become custom availability.
     */
    const resizedManualBlock = createManualTimeBlock(
      blockToResize.day,
      from,
      to
    );

    setSelectedPresetIds((currentPresetIds) =>
      currentPresetIds.filter((presetId) => {
        const preset = AVAILABILITY_PRESETS.find((item) => item.id === presetId);

        if (!preset) return false;

        return !preset.blocks.every((presetBlock) =>
          blockCoversBlock(blockToResize, presetBlock)
        );
      })
    );

    setCustomBlocks((currentBlocks) =>
      mergeTimeBlocks([
        ...currentBlocks.filter(
          (block) => !blockFullyContains(blockToResize, block)
        ),
        resizedManualBlock,
      ])
    );

    setSelectedBlockId(resizedManualBlock.id);
  }

  function removeBlock(blockToRemove: TimeBlock) {
    const affectedPresets = AVAILABILITY_PRESETS.filter((preset) =>
      selectedPresetIds.includes(preset.id)
    ).filter((preset) =>
      preset.blocks.some((presetBlock) =>
        blockTouchesOrOverlaps(blockToRemove, presetBlock)
      )
    );

    const affectedPresetIds = affectedPresets.map((preset) => preset.id);

    /**
     * Presets are generated from the selected preset cards.
     *
     * If the user deletes one visible block from the grid, we remove any
     * preset that contributed to that block. For multi-day presets, we add
     * back the unaffected days as manual blocks so only the deleted visible
     * block disappears.
     */
    const unaffectedPresetBlocks = affectedPresets
      .flatMap((preset) => preset.blocks)
      .filter((presetBlock) => !blockFullyContains(blockToRemove, presetBlock))
      .map((presetBlock) =>
        createManualTimeBlock(presetBlock.day, presetBlock.from, presetBlock.to)
      );

    setSelectedPresetIds((currentPresetIds) =>
      currentPresetIds.filter((presetId) => !affectedPresetIds.includes(presetId))
    );

    setCustomBlocks((currentBlocks) =>
      mergeTimeBlocks([
        ...currentBlocks.filter(
          (customBlock) => !blockFullyContains(blockToRemove, customBlock)
        ),
        ...unaffectedPresetBlocks,
      ])
    );

    setSelectedBlockId(null);
  }

  function clearAvailability() {
    setSelectedPresetIds([]);
    setCustomBlocks([]);
    setSelectedBlockId(null);
  }

  function saveDraftProfile() {
    updateStoredLearningProfile({ availability });
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

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {AVAILABILITY_PRESETS.map((preset) => (
              <OptionCard
                key={preset.id}
                title={preset.label}
                description={preset.description}
                selected={selectedPresetIds.includes(preset.id)}
                onToggle={() => togglePreset(preset.id)}
              />
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Add a manual time</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Pick one or more days, then add the same time block to all of them.
          </p>

          <div className="mt-5 grid gap-4">
            <div>
              <p className="text-sm font-medium text-slate-700">Days</p>

              <div className="mt-2 grid grid-cols-7 gap-2">
                {DAYS.map((day) => {
                  const selected = manualDays.includes(day);

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleManualDay(day)}
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
                  value={manualFrom}
                  onChange={(event) => setManualFrom(event.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                To
                <input
                  type="time"
                  value={manualTo}
                  onChange={(event) => setManualTo(event.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950"
                />
              </label>
            </div>

            <Button
              variant="secondary"
              disabled={manualDays.length === 0}
              onClick={addManualBlocks}
            >
              Add time
            </Button>
          </div>
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Selected availability</h2>
              <p className="mt-2 text-sm text-slate-600">
                These times will be used when you request a trial session.
              </p>
            </div>

            <Button
              variant="ghost"
              disabled={availability.length === 0}
              onClick={clearAvailability}
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
                onClick={() => removeBlock(block)}
              >
                <Badge className="hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">
                  {timeBlockLabel(block)} ×
                </Badge>
              </button>
            ))}
          </div>
        </Card>
      </Container>

      <StudentOnboardingSectionBar
        currentStep="availability"
        onBeforeNavigate={saveDraftProfile}
      />
    </main>
  );
}
