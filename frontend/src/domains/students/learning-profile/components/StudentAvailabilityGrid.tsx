'use client';

import { MouseEvent, useMemo, useRef, useState } from 'react';
import { DAYS } from '@/domains/students/learning-profile/constants/learningProfileOptions';
import type {
  Day,
  TimeBlock,
} from '@/domains/students/learning-profile/types/learningProfile';
import {
  findBlockCoveringTime,
  minutesToTime,
  snapMinutesToThirty,
  timeToMinutes,
} from '@/domains/students/learning-profile/utils/timeBlocks';

type StudentAvailabilityGridProps = {
  blocks: TimeBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onAddTimeRange: (day: Day, from: string, to: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onResizeBlock: (blockId: string, from: string, to: string) => void;
};

type DragCreate = {
  day: Day;
  startMinutes: number;
  endMinutes: number;
};

type ResizeDraft = {
  blockId: string;
  day: Day;
  edge: 'top' | 'bottom';
  from: string;
  to: string;
};

const TOTAL_DAY_MINUTES = 24 * 60;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 24;

const TIME_SLOTS = Array.from(
  { length: TOTAL_DAY_MINUTES / SLOT_MINUTES },
  (_, index) => minutesToTime(index * SLOT_MINUTES)
);

function blockStyle(block: TimeBlock) {
  const start = timeToMinutes(block.from);
  const end = timeToMinutes(block.to);

  return {
    top: `${(start / TOTAL_DAY_MINUTES) * 100}%`,
    height: `${((end - start) / TOTAL_DAY_MINUTES) * 100}%`,
  };
}

function normaliseRange(start: number, end: number) {
  const from = Math.min(start, end);
  const to = Math.max(start, end) + SLOT_MINUTES;

  return {
    from: minutesToTime(from),
    to: minutesToTime(Math.min(to, TOTAL_DAY_MINUTES)),
  };
}

export function StudentAvailabilityGrid({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onAddTimeRange,
  onDeleteBlock,
  onResizeBlock,
}: StudentAvailabilityGridProps) {
  const dayColumnRefs = useRef<Partial<Record<Day, HTMLDivElement>>>({});
  const [dragCreate, setDragCreate] = useState<DragCreate | null>(null);
  const [resizeDraft, setResizeDraft] = useState<ResizeDraft | null>(null);

  const visibleBlocks = useMemo(() => {
    if (!resizeDraft) {
      return blocks;
    }

    return blocks.map((block) =>
      block.id === resizeDraft.blockId
        ? { ...block, from: resizeDraft.from, to: resizeDraft.to }
        : block
    );
  }, [blocks, resizeDraft]);

  const createDraftBlock = dragCreate
    ? {
        id: 'draft-create',
        day: dragCreate.day,
        ...normaliseRange(dragCreate.startMinutes, dragCreate.endMinutes),
        source: 'manual' as const,
      }
    : null;

  function getMinutesFromMouse(day: Day, event: MouseEvent | globalThis.MouseEvent) {
    const dayColumn = dayColumnRefs.current[day];

    if (!dayColumn) {
      return 0;
    }

    const dayRect = dayColumn.getBoundingClientRect();
    const relativeY = event.clientY - dayRect.top;
    const rawMinutes = (relativeY / dayRect.height) * TOTAL_DAY_MINUTES;
    const snappedMinutes = snapMinutesToThirty(rawMinutes);

    return Math.max(0, Math.min(TOTAL_DAY_MINUTES, snappedMinutes));
  }

  function handleSlotMouseDown(day: Day, slot: string) {
    const coveringBlock = findBlockCoveringTime(visibleBlocks, day, slot);

    if (coveringBlock) {
      onSelectBlock(coveringBlock.id);
      return;
    }

    const startMinutes = timeToMinutes(slot);

    setDragCreate({
      day,
      startMinutes,
      endMinutes: startMinutes,
    });
  }

  function handleSlotMouseEnter(day: Day, slot: string) {
    if (!dragCreate || dragCreate.day !== day) {
      return;
    }

    setDragCreate((currentDraft) =>
      currentDraft
        ? {
            ...currentDraft,
            endMinutes: timeToMinutes(slot),
          }
        : currentDraft
    );
  }

  function handleMouseUp() {
    if (dragCreate) {
      const range = normaliseRange(dragCreate.startMinutes, dragCreate.endMinutes);
      onAddTimeRange(dragCreate.day, range.from, range.to);
      setDragCreate(null);
    }

    if (resizeDraft) {
      onResizeBlock(resizeDraft.blockId, resizeDraft.from, resizeDraft.to);
      setResizeDraft(null);
    }
  }

  function startResize(
    block: TimeBlock,
    edge: 'top' | 'bottom',
    event: MouseEvent
  ) {
    event.preventDefault();
    event.stopPropagation();

    onSelectBlock(block.id);

    setResizeDraft({
      blockId: block.id,
      day: block.day,
      edge,
      from: block.from,
      to: block.to,
    });
  }

  function handleColumnMouseMove(day: Day, event: MouseEvent) {
    if (!resizeDraft || resizeDraft.day !== day) {
      return;
    }

    const mouseMinutes = getMinutesFromMouse(day, event);

    setResizeDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      const currentFrom = timeToMinutes(currentDraft.from);
      const currentTo = timeToMinutes(currentDraft.to);

      if (currentDraft.edge === 'top') {
        const nextFrom = Math.min(mouseMinutes, currentTo - SLOT_MINUTES);

        return {
          ...currentDraft,
          from: minutesToTime(nextFrom),
        };
      }

      const nextTo = Math.max(mouseMinutes, currentFrom + SLOT_MINUTES);

      return {
        ...currentDraft,
        to: minutesToTime(nextTo),
      };
    });
  }

  return (
    <div
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="rounded-2xl border border-slate-200 bg-white p-4"
    >
      <div className="max-h-[560px] overflow-auto rounded-xl border border-slate-200 bg-slate-50">
        <div className="sticky top-0 z-20 grid grid-cols-[64px_repeat(7,minmax(72px,1fr))] border-b border-slate-200 bg-white">
          <div className="border-r border-slate-200 p-2 text-xs font-medium text-slate-500">
            Time
          </div>

          {DAYS.map((day) => (
            <div
              key={day}
              className="border-r border-slate-200 p-2 text-center text-xs font-semibold text-slate-700 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[64px_repeat(7,minmax(72px,1fr))]">
          <div>
            {TIME_SLOTS.map((slot) => (
              <div
                key={slot}
                style={{ height: SLOT_HEIGHT }}
                className="border-b border-slate-200 pr-1 text-right text-[10px] font-medium text-slate-500"
              >
                {slot.endsWith(':00') ? slot : ''}
              </div>
            ))}
          </div>

          {DAYS.map((day) => (
            <div
              key={day}
              ref={(element) => {
                if (element) {
                  dayColumnRefs.current[day] = element;
                }
              }}
              onMouseMove={(event) => handleColumnMouseMove(day, event)}
              className="relative border-l border-slate-200"
              style={{ height: TIME_SLOTS.length * SLOT_HEIGHT }}
            >
              {TIME_SLOTS.map((slot) => (
                <button
                  key={`${day}-${slot}`}
                  type="button"
                  onMouseDown={() => handleSlotMouseDown(day, slot)}
                  onMouseEnter={() => handleSlotMouseEnter(day, slot)}
                  className="absolute left-0 w-full border-b border-slate-200 hover:bg-slate-100"
                  style={{
                    top: timeToMinutes(slot) * (SLOT_HEIGHT / SLOT_MINUTES),
                    height: SLOT_HEIGHT,
                  }}
                  aria-label={`${day} ${slot}`}
                />
              ))}

              {[...visibleBlocks, ...(createDraftBlock?.day === day ? [createDraftBlock] : [])]
                .filter((block) => block.day === day)
                .map((block) => {
                  const isDraft = block.id === 'draft-create';
                  const selected = block.id === selectedBlockId || isDraft;

                  return (
                    <button
                      key={block.id}
                      type="button"
                      onClick={() => !isDraft && onSelectBlock(block.id)}
                      onContextMenu={(event) => {
                        event.preventDefault();

                        if (!isDraft) {
                          onDeleteBlock(block.id);
                        }
                      }}
                      style={blockStyle(block)}
                      className={`absolute left-1 right-1 z-10 overflow-hidden rounded-lg border border-slate-300 px-2 py-1 text-left text-[11px] font-medium leading-tight transition ${
                        selected
                          ? 'bg-slate-300 text-slate-900 shadow-sm'
                          : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {!isDraft && (
                        <span
                          onMouseDown={(event) => startResize(block, 'top', event)}
                          className="absolute left-1 right-1 top-0 h-1.5 cursor-ns-resize rounded-full bg-slate-900/20"
                        />
                      )}

                      <span className="pointer-events-none block pt-1">
                        {block.from}–{block.to}
                      </span>

                      {!isDraft && (
                        <span
                          onMouseDown={(event) => startResize(block, 'bottom', event)}
                          className="absolute bottom-0 left-1 right-1 h-1.5 cursor-ns-resize rounded-full bg-slate-900/20"
                        />
                      )}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Drag across 30-minute slots to add a block. Drag top/bottom handles to resize.
        Right-click any block to remove it.
      </p>
    </div>
  );
}
