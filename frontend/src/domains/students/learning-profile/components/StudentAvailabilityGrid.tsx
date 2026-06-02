'use client';

import { MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { DAYS } from '@/domains/students/learning-profile/constants/learningProfileOptions';
import type {
  Day,
  TimeBlock,
} from '@/domains/students/learning-profile/types/learningProfile';
import {
  findBlockCoveringTime,
  minutesToTime,
  timeToMinutes,
} from '@/domains/students/learning-profile/utils/timeBlocks';
import {
  normaliseGridRange,
  SLOT_MINUTES,
  snapMouseYToGridMinutes,
  TIME_SLOTS,
} from '@/domains/students/learning-profile/utils/availabilityGridMath';
import {
  DayColumn,
  GridHeader,
  TimeLabels,
} from '@/domains/students/learning-profile/components/availability/AvailabilityGridLayout';

type StudentAvailabilityGridProps = {
  blocks: TimeBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onAddTimeRange: (day: Day, from: string, to: string) => void;
  onDeleteBlock: (block: TimeBlock) => void;
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

function eventStartedInsideFormControl(event: globalThis.KeyboardEvent) {
  const target = event.target as HTMLElement | null;

  return Boolean(
    target?.closest('input, textarea, select, [contenteditable="true"]')
  );
}

/**
 * Interactive weekly availability grid.
 *
 * The parent owns the real availability state. This component only handles grid
 * interactions: drag-to-create, drag-to-resize, click-to-select, and keyboard
 * deletion. Keeping it controlled makes the parent and grid easier to reason
 * about separately.
 */
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

  /**
   * While resizing, show the draft dimensions immediately so the UI feels live.
   * The parent is only updated when the mouse is released.
   */
  const visibleBlocks = useMemo(() => {
    if (!resizeDraft) return blocks;

    return blocks.map((block) =>
      block.id === resizeDraft.blockId
        ? { ...block, from: resizeDraft.from, to: resizeDraft.to }
        : block
    );
  }, [blocks, resizeDraft]);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (eventStartedInsideFormControl(event)) return;
      if (event.key !== 'Backspace' && event.key !== 'Delete') return;
      if (!selectedBlockId) return;

      const selectedBlock = visibleBlocks.find(
        (block) => block.id === selectedBlockId
      );

      if (!selectedBlock) return;

      event.preventDefault();
      onDeleteBlock(selectedBlock);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDeleteBlock, selectedBlockId, visibleBlocks]);

  const createDraftBlock = dragCreate
    ? {
        id: 'draft-create',
        day: dragCreate.day,
        ...normaliseGridRange(dragCreate.startMinutes, dragCreate.endMinutes),
        source: 'manual' as const,
      }
    : null;

  function getMinutesFromMouse(
    day: Day,
    event: MouseEvent | globalThis.MouseEvent
  ) {
    const dayColumn = dayColumnRefs.current[day];
    if (!dayColumn) return 0;

    const dayRect = dayColumn.getBoundingClientRect();

    return snapMouseYToGridMinutes({
      clientY: event.clientY,
      columnTop: dayRect.top,
      columnHeight: dayRect.height,
    });
  }

  function handleSlotMouseDown(day: Day, slot: string) {
    /**
     * If the student starts on an existing block, select it rather than adding
     * a second hidden block underneath it.
     */
    const coveringBlock = findBlockCoveringTime(visibleBlocks, day, slot);

    if (coveringBlock) {
      onSelectBlock(coveringBlock.id);
      return;
    }

    const startMinutes = timeToMinutes(slot);

    setDragCreate({ day, startMinutes, endMinutes: startMinutes });
  }

  function handleSlotMouseEnter(day: Day, slot: string) {
    if (!dragCreate || dragCreate.day !== day) return;

    setDragCreate((currentDraft) =>
      currentDraft
        ? { ...currentDraft, endMinutes: timeToMinutes(slot) }
        : currentDraft
    );
  }

  function handleMouseUp() {
    if (dragCreate) {
      const range = normaliseGridRange(
        dragCreate.startMinutes,
        dragCreate.endMinutes
      );

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
    if (!resizeDraft || resizeDraft.day !== day) return;

    const mouseMinutes = getMinutesFromMouse(day, event);

    setResizeDraft((currentDraft) => {
      if (!currentDraft) return currentDraft;

      const currentFrom = timeToMinutes(currentDraft.from);
      const currentTo = timeToMinutes(currentDraft.to);

      if (currentDraft.edge === 'top') {
        return {
          ...currentDraft,
          from: minutesToTime(Math.min(mouseMinutes, currentTo - SLOT_MINUTES)),
        };
      }

      return {
        ...currentDraft,
        to: minutesToTime(Math.max(mouseMinutes, currentFrom + SLOT_MINUTES)),
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
        <GridHeader />

        <div className="grid grid-cols-[64px_repeat(7,minmax(72px,1fr))]">
          <TimeLabels />

          {DAYS.map((day) => (
            <DayColumn
              key={day}
              day={day}
              refCallback={(element) => {
                if (element) dayColumnRefs.current[day] = element;
              }}
              blocks={visibleBlocks}
              createDraftBlock={createDraftBlock}
              selectedBlockId={selectedBlockId}
              onSlotMouseDown={handleSlotMouseDown}
              onSlotMouseEnter={handleSlotMouseEnter}
              onColumnMouseMove={handleColumnMouseMove}
              onSelectBlock={onSelectBlock}
              onDeleteBlock={onDeleteBlock}
              onStartResize={startResize}
            />
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Drag across 30-minute slots to add a block. Drag the top or bottom edge
        of any block to resize it. Click a block, then press Backspace/Delete to
        remove it.
      </p>
    </div>
  );
}
