'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { Badge } from '@/shared/components/Badge';
import { ROUTES } from '@/shared/constants/routes';
import {
  AVAILABILITY_PRESETS,
  DAYS,
} from '@/domains/students/learning-profile/constants/learningProfileOptions';
import { OptionCard } from '@/domains/students/learning-profile/components/OptionCard';
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
import type { Day, TimeBlock } from '@/domains/students/learning-profile/types/learningProfile';

/**
 * Final student onboarding step.
 *
 * Availability is stored in the learning profile so trial requests can include
 * useful context instead of forcing tutor and student to start from zero.
 */
export function StudentAvailabilityStep() {
  const router = useRouter();
  const [availability, setAvailability] = useState<TimeBlock[]>(
    getStoredLearningProfile().availability
  );
  const [manualDay, setManualDay] = useState<Day>('Mon');
  const [manualFrom, setManualFrom] = useState('18:00');
  const [manualTo, setManualTo] = useState('19:00');


  const selectedPresetIds = useMemo(() => {
    return AVAILABILITY_PRESETS.filter((preset) =>
      preset.blocks.every((presetBlock) =>
        availability.some(
          (block) =>
            block.day === presetBlock.day &&
            block.from === presetBlock.from &&
            block.to === presetBlock.to
        )
      )
    ).map((preset) => preset.id);
  }, [availability]);

  function togglePreset(presetId: string) {
    const preset = AVAILABILITY_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    if (selectedPresetIds.includes(presetId)) {
      setAvailability((currentBlocks) =>
        currentBlocks.filter(
          (block) => !preset.blocks.some((presetBlock) => presetBlock.id === block.id)
        )
      );
      return;
    }

    setAvailability((currentBlocks) => mergeTimeBlocks([...currentBlocks, ...preset.blocks]));
  }

  function addManualBlock() {
    if (timeToMinutes(manualFrom) >= timeToMinutes(manualTo)) return;

    setAvailability((currentBlocks) =>
      mergeTimeBlocks([
        ...currentBlocks,
        createManualTimeBlock(manualDay, manualFrom, manualTo),
      ])
    );
  }

  function removeBlock(blockId: string) {
    setAvailability((currentBlocks) =>
      currentBlocks.filter((block) => block.id !== blockId)
    );
  }

  function finishOnboarding() {
    updateStoredLearningProfile({ availability });
    router.push(ROUTES.studentTutors);
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Student onboarding"
        title="When are you usually available?"
        description="Choose common times or add your own. This makes trial requests easier to respond to."
      />

      <Container className="grid gap-6 py-10 lg:grid-cols-[1.1fr_0.9fr]">
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
                  <option key={day} value={day}>{day}</option>
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
                These times will be used as context when requesting a trial session.
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
              <button key={block.id} type="button" onClick={() => removeBlock(block.id)}>
                <Badge className="hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">
                  {timeBlockLabel(block)} ×
                </Badge>
              </button>
            ))}
          </div>
        </Card>
      </Container>
    </main>
  );
}
