'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { ROUTES } from '@/shared/constants/routes';
import { OptionCard } from '@/domains/students/learning-profile/components/OptionCard';
import { StudentOnboardingSectionBar } from '@/domains/students/learning-profile/components/StudentOnboardingSectionBar';
import {
  AVAILABILITY_PRESETS,
  DAYS,
} from '@/domains/students/learning-profile/constants/learningProfileOptions';
import {
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

/**
 * Checks whether a saved/merged time block fully covers another time block.
 *
 * Example:
 * saved block:  Mon 16:00–21:00
 * preset block: Mon 16:00–18:00
 *
 * This returns true because the saved block contains the preset block.
 */
function blockCoversBlock(savedBlock: TimeBlock, targetBlock: TimeBlock) {
  if (savedBlock.day !== targetBlock.day) return false;

  return (
    timeToMinutes(savedBlock.from) <= timeToMinutes(targetBlock.from) &&
    timeToMinutes(savedBlock.to) >= timeToMinutes(targetBlock.to)
  );
}

/**
 * Works out which preset cards should appear selected when the page loads.
 *
 * This is deliberately based on time coverage, not exact block equality.
 * That means presets stay highlighted even when neighbouring times have
 * been merged into one larger availability block.
 */
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
 * The important idea here is that selected preset cards and selected
 * availability blocks are not exactly the same thing.
 *
 * Preset cards need to stay highlighted.
 * Availability blocks need to stay readable, so overlapping times are merged.
 */
export function StudentAvailabilityStep() {
  const router = useRouter();
  const storedProfile = getStoredLearningProfile();

  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>(
    getInitialSelectedPresetIds(storedProfile.availability)
  );

  const [manualBlocks, setManualBlocks] = useState<TimeBlock[]>(
    storedProfile.availability.filter((block) => block.source === 'manual')
  );

  const [manualDay, setManualDay] = useState<Day>('Mon');
  const [manualFrom, setManualFrom] = useState('18:00');
  const [manualTo, setManualTo] = useState('19:00');

  const presetBlocks = useMemo(() => {
    return AVAILABILITY_PRESETS.filter((preset) =>
      selectedPresetIds.includes(preset.id)
    ).flatMap((preset) => preset.blocks);
  }, [selectedPresetIds]);

  const availability = useMemo(() => {
    return mergeTimeBlocks([...presetBlocks, ...manualBlocks]);
  }, [presetBlocks, manualBlocks]);

  function togglePreset(presetId: string) {
    setSelectedPresetIds((currentPresetIds) => {
      if (currentPresetIds.includes(presetId)) {
        return currentPresetIds.filter((id) => id !== presetId);
      }

      return [...currentPresetIds, presetId];
    });
  }

  function addManualBlock() {
    if (timeToMinutes(manualFrom) >= timeToMinutes(manualTo)) return;

    const newManualBlock = createManualTimeBlock(
      manualDay,
      manualFrom,
      manualTo
    );

    setManualBlocks((currentBlocks) =>
      mergeTimeBlocks([...currentBlocks, newManualBlock])
    );
  }

  function removeBlock(blockToRemove: TimeBlock) {
    /**
     * If the block is a manual block, remove it from manual availability.
     */
    setManualBlocks((currentBlocks) =>
      currentBlocks.filter((block) => block.id !== blockToRemove.id)
    );

    /**
     * If the block came from presets, deselect any preset that is fully
     * covered by this block.
     *
     * This avoids confusing behaviour when one visible block represents
     * multiple merged preset times.
     */
    setSelectedPresetIds((currentPresetIds) =>
      currentPresetIds.filter((presetId) => {
        const preset = AVAILABILITY_PRESETS.find((item) => item.id === presetId);
        if (!preset) return false;

        return !preset.blocks.every((presetBlock) =>
          blockCoversBlock(blockToRemove, presetBlock)
        );
      })
    );
  }

  function finishOnboarding() {
    updateStoredLearningProfile({ availability });
    router.push(ROUTES.studentTutors);
  }

  function saveDraftProfile() {
    updateStoredLearningProfile({ availability });
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Student onboarding"
        title="When are you usually available?"
        description="Choose common times or add your own. This makes trial requests easier to respond to."
      />

      <Container className="grid gap-6 py-10 pb-28 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-xl font-semibold">Quick presets</h2>

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

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Day
              <select
                value={manualDay}
                onChange={(event) => setManualDay(event.target.value as Day)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950"
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>

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

            <Button variant="secondary" onClick={addManualBlock}>
              Add time
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Selected availability</h2>
              <p className="mt-2 text-sm text-slate-600">
                These times will be used as context when requesting a trial
                session.
              </p>
            </div>

            <Button disabled={availability.length === 0} onClick={finishOnboarding}>
              Find tutors
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