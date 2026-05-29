'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import AvailabilityGrid from '../../components/onboarding/AvailabilityGrid';
import ChoiceButton from '../../components/onboarding/ChoiceButton';
import StepTabs from '../../components/onboarding/StepTabs';
import { Day, days, presets, TimeBlock } from '../../lib/timeOptions';
import {
  blockOverlaps,
  isValidTime,
  makeId,
  mergeAllBlocks,
  mergeBlockIntoBlocks,
} from '../../lib/timeUtils';

function presetBlockBelongsTo(presetId: string, block: TimeBlock) {
  return block.source === 'preset' && block.id.startsWith(`${presetId}-`);
}

function presetCollidesWithExistingBlocks(presetId: string, blocks: TimeBlock[]) {
  const preset = presets.find((item) => item.id === presetId);

  if (!preset) {
    return false;
  }

  return preset.blocks.some((presetBlock) =>
    blocks.some((existingBlock) => blockOverlaps(presetBlock, existingBlock))
  );
}

export default function TimeOnboardingPage() {
  const defaultPreset = presets.find((preset) => preset.id === 'weekday-evenings');

  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>(
    defaultPreset ? [defaultPreset.id] : []
  );

  const [blocks, setBlocks] = useState<TimeBlock[]>(defaultPreset?.blocks ?? []);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const [showExactForm, setShowExactForm] = useState(false);
  const [manualDay, setManualDay] = useState<Day>('Mon');
  const [manualFrom, setManualFrom] = useState('18:50');
  const [manualTo, setManualTo] = useState('19:50');
  const [repeatWeekly, setRepeatWeekly] = useState(true);

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId]
  );

  const selectedPresets = presets.filter((preset) => selectedPresetIds.includes(preset.id));

  const manualBlocks = blocks.filter((block) => block.source === 'manual');

  const handlePresetClick = (presetId: string) => {
    const preset = presets.find((item) => item.id === presetId);

    if (!preset) {
      return;
    }

    if (selectedPresetIds.includes(presetId)) {
      setSelectedPresetIds((current) => current.filter((id) => id !== presetId));
      setBlocks((current) => current.filter((block) => !presetBlockBelongsTo(presetId, block)));
      setSelectedBlockId(null);
      return;
    }

    if (presetCollidesWithExistingBlocks(presetId, blocks)) {
      alert('That quick select overlaps with an existing availability block.');
      return;
    }

    setSelectedPresetIds((current) => [...current, presetId]);
    setBlocks((current) => mergeAllBlocks([...current, ...preset.blocks]));
    setSelectedBlockId(null);
  };

  const handleAddTimeRange = (day: Day, from: string, to: string) => {
    const newBlock: TimeBlock = {
      id: makeId(),
      day,
      from,
      to,
      source: 'grid',
    };

    setBlocks((current) => mergeBlockIntoBlocks(current, newBlock));
  };

  const handleAddExactTime = () => {
    if (!isValidTime(manualFrom) || !isValidTime(manualTo)) {
      alert('Use valid 24-hour times, for example 18:50. Minutes must be 00–59.');
      return;
    }

    if (manualFrom >= manualTo) {
      alert('The start time must be before the end time.');
      return;
    }

    const newBlock: TimeBlock = {
      id: makeId(),
      day: manualDay,
      from: manualFrom,
      to: manualTo,
      source: 'manual',
    };

    const nextBlocks = mergeBlockIntoBlocks(blocks, newBlock);

    setBlocks(nextBlocks);

    const mergedBlock = nextBlocks.find(
      (block) => block.day === manualDay && block.from <= manualFrom && block.to >= manualTo
    );

    setSelectedBlockId(mergedBlock?.id ?? newBlock.id);
    setShowExactForm(false);
  };

  const handleDeleteBlock = (blockId: string) => {
    setBlocks((current) => current.filter((block) => block.id !== blockId));
    setSelectedBlockId(null);
  };

  const handleResizeBlock = (blockId: string, from: string, to: string) => {
    setBlocks((current) => {
      const blockToResize = current.find((block) => block.id === blockId);

      if (!blockToResize) {
        return current;
      }

      const resizedBlock: TimeBlock = {
        ...blockToResize,
        from,
        to,
        source: blockToResize.source === 'preset' ? 'grid' : blockToResize.source,
      };

      const otherBlocks = current.filter((block) => block.id !== blockId);

      return mergeBlockIntoBlocks(otherBlocks, resizedBlock);
    });
  };

  return (
    <main className="min-h-screen bg-[#f7fbff] px-4 py-4 text-slate-950 sm:px-8 lg:px-12">
      <section className="mx-auto min-h-[calc(100vh-32px)] max-w-7xl rounded-[2rem] border-2 border-slate-950 bg-white px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:px-8 lg:px-12">
        <header className="flex items-start justify-between gap-6">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            When are you usually available?
          </h1>

          <Link
            href="/tutor-dashboard"
            className="rounded-xl border-2 border-slate-950 bg-cyan-100 px-5 py-2.5 text-sm font-semibold shadow-[3px_3px_0_#0f172a] transition hover:bg-cyan-200"
          >
            Tutor View
          </Link>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-bold">Quick select</h2>

                <button
                  type="button"
                  onClick={() => setShowExactForm((current) => !current)}
                  className="rounded-xl border-2 border-slate-950 bg-white px-5 py-2.5 text-sm font-semibold shadow-[3px_3px_0_#0f172a] transition hover:bg-cyan-50"
                >
                  Add exact time +
                </button>
              </div>

              <div className="flex flex-wrap gap-4">
                {presets.map((preset) => (
                  <ChoiceButton
                    key={preset.id}
                    label={preset.label}
                    selected={selectedPresetIds.includes(preset.id)}
                    onClick={() => handlePresetClick(preset.id)}
                  />
                ))}
              </div>

              {selectedPresets.length > 0 && (
                <div className="mt-5 space-y-2">
                  {selectedPresets.map((preset) => (
                    <p
                      key={preset.id}
                      className="max-w-3xl rounded-2xl border-2 border-slate-950 bg-cyan-50 px-5 py-3 text-sm font-semibold"
                    >
                      {preset.label} selected: {preset.description}. Adjust below if needed.
                    </p>
                  ))}
                </div>
              )}
            </section>

            {showExactForm && (
              <section className="rounded-[1.75rem] border-2 border-slate-950 bg-slate-50 p-5 shadow-[6px_6px_0_#0f172a]">
                <h2 className="mb-5 text-xl font-bold">Add exact time</h2>

                <div className="grid gap-4 md:grid-cols-4">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-600">Day</span>
                    <select
                      value={manualDay}
                      onChange={(event) => setManualDay(event.target.value as Day)}
                      className="w-full rounded-xl border-2 border-slate-950 bg-white px-4 py-3 font-semibold"
                    >
                      {days.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-600">From</span>
                    <input
                      type="text"
                      value={manualFrom}
                      placeholder="18:50"
                      onChange={(event) => setManualFrom(event.target.value)}
                      className="w-full rounded-xl border-2 border-slate-950 bg-white px-4 py-3 font-semibold"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-600">To</span>
                    <input
                      type="text"
                      value={manualTo}
                      placeholder="19:50"
                      onChange={(event) => setManualTo(event.target.value)}
                      className="w-full rounded-xl border-2 border-slate-950 bg-white px-4 py-3 font-semibold"
                    />
                  </label>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddExactTime}
                      className="w-full rounded-xl border-2 border-slate-950 bg-cyan-100 px-5 py-3 font-bold shadow-[3px_3px_0_#0f172a] transition hover:bg-cyan-200"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <label className="mt-5 flex items-center gap-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={repeatWeekly}
                    onChange={(event) => setRepeatWeekly(event.target.checked)}
                    className="h-5 w-5"
                  />
                  Repeat weekly ✓
                </label>
              </section>
            )}

            <section>
              <h2 className="mb-4 text-xl font-bold">
                Select 30-minute slots or add exact times
              </h2>

              <AvailabilityGrid
                blocks={blocks}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                onAddTimeRange={handleAddTimeRange}
                onDeleteBlock={handleDeleteBlock}
                onResizeBlock={handleResizeBlock}
              />
            </section>
          </div>

          <aside className="h-fit rounded-[1.75rem] border-2 border-slate-950 bg-[#f7fbff] p-6 shadow-[6px_6px_0_#0f172a]">
            <h2 className="text-xl font-bold">Selected availability</h2>

            <div className="mt-5 space-y-5 text-sm">
              {selectedPresets.length > 0 && (
                <div>
                  <p className="font-semibold text-slate-500">Quick select</p>

                  <div className="mt-2 space-y-2">
                    {selectedPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="rounded-lg border-2 border-slate-950 bg-cyan-100 px-3 py-2 font-semibold"
                      >
                        {preset.label}: {preset.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="font-semibold text-slate-500">Selected block</p>

                {selectedBlock ? (
                  <div className="mt-2 rounded-lg border-2 border-slate-950 bg-blue-100 px-3 py-2 font-semibold">
                    {selectedBlock.day} {selectedBlock.from}–{selectedBlock.to}

                    <button
                      type="button"
                      onClick={() => handleDeleteBlock(selectedBlock.id)}
                      className="mt-3 block rounded-lg border-2 border-slate-950 bg-white px-3 py-1 text-xs font-bold hover:bg-red-50"
                    >
                      Remove block
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-slate-500">Click a block in the timetable.</p>
                )}
              </div>

              <div>
                <p className="font-semibold text-slate-500">Exact times</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {manualBlocks.length === 0 && (
                    <span className="text-slate-500">No exact times added yet</span>
                  )}

                  {manualBlocks.map((block) => (
                    <button
                      key={block.id}
                      type="button"
                      onClick={() => setSelectedBlockId(block.id)}
                      className="rounded-lg border-2 border-slate-950 bg-green-100 px-3 py-1 font-semibold hover:bg-green-200"
                    >
                      {block.day} {block.from}–{block.to}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-500">Repeat</p>

                <p className="mt-2 rounded-lg border-2 border-slate-950 bg-white px-3 py-2 font-semibold">
                  {repeatWeekly ? 'Weekly availability' : 'One-off availability'}
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-14 flex justify-between pb-24">
          <Link
            href="/"
            className="rounded-xl border-2 border-slate-950 bg-white px-8 py-3 text-xl font-medium transition hover:bg-slate-50"
          >
            ← Back
          </Link>

          <Link
            href="/preferences"
            className="rounded-xl border-2 border-slate-950 bg-white px-8 py-3 text-xl font-medium transition hover:bg-slate-50"
          >
            Next →
          </Link>
        </div>
      </section>

      <StepTabs activeStep="time" />
    </main>
  );
}