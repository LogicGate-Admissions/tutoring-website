import { MouseEvent } from 'react';
import { DAYS } from '@/domains/students/learning-profile/constants/learningProfileOptions';
import type { Day, TimeBlock } from '@/domains/students/learning-profile/types/learningProfile';
import {
  getBlockStyle,
  getSlotTop,
  SLOT_HEIGHT,
  TIME_SLOTS,
} from '@/domains/students/learning-profile/utils/availabilityGridMath';

/**
 * Presentational pieces for StudentAvailabilityGrid.
 *
 * The parent grid owns interaction state. These smaller components only render
 * the timetable structure, which keeps the main grid file easier to scan.
 */

export function GridHeader() {
  return (
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
  );
}

export function TimeLabels() {
  return (
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
  );
}

export function DayColumn({
  day,
  refCallback,
  blocks,
  createDraftBlock,
  selectedBlockId,
  onSlotMouseDown,
  onSlotMouseEnter,
  onColumnMouseMove,
  onSelectBlock,
  onDeleteBlock,
  onStartResize,
}: {
  day: Day;
  refCallback: (element: HTMLDivElement | null) => void;
  blocks: TimeBlock[];
  createDraftBlock: TimeBlock | null;
  selectedBlockId: string | null;
  onSlotMouseDown: (day: Day, slot: string) => void;
  onSlotMouseEnter: (day: Day, slot: string) => void;
  onColumnMouseMove: (day: Day, event: MouseEvent) => void;
  onSelectBlock: (blockId: string) => void;
  onDeleteBlock: (block: TimeBlock) => void;
  onStartResize: (
    block: TimeBlock,
    edge: 'top' | 'bottom',
    event: MouseEvent
  ) => void;
}) {
  const blocksForDay = [
    ...blocks,
    ...(createDraftBlock?.day === day ? [createDraftBlock] : []),
  ].filter((block) => block.day === day);

  return (
    <div
      ref={refCallback}
      onMouseMove={(event) => onColumnMouseMove(day, event)}
      className="relative border-l border-slate-200"
      style={{ height: TIME_SLOTS.length * SLOT_HEIGHT }}
    >
      {TIME_SLOTS.map((slot) => (
        <button
          key={`${day}-${slot}`}
          type="button"
          onMouseDown={() => onSlotMouseDown(day, slot)}
          onMouseEnter={() => onSlotMouseEnter(day, slot)}
          className="absolute left-0 w-full border-b border-slate-200 hover:bg-slate-100"
          style={{ top: getSlotTop(slot), height: SLOT_HEIGHT }}
          aria-label={`${day} ${slot}`}
        />
      ))}

      {blocksForDay.map((block) => (
        <AvailabilityBlockButton
          key={block.id}
          block={block}
          selected={block.id === selectedBlockId || block.id === 'draft-create'}
          onSelectBlock={onSelectBlock}
          onDeleteBlock={onDeleteBlock}
          onStartResize={onStartResize}
        />
      ))}
    </div>
  );
}

function AvailabilityBlockButton({
  block,
  selected,
  onSelectBlock,
  onDeleteBlock,
  onStartResize,
}: {
  block: TimeBlock;
  selected: boolean;
  onSelectBlock: (blockId: string) => void;
  onDeleteBlock: (block: TimeBlock) => void;
  onStartResize: (
    block: TimeBlock,
    edge: 'top' | 'bottom',
    event: MouseEvent
  ) => void;
}) {
  const isDraft = block.id === 'draft-create';
  const canResize = !isDraft;

  return (
    <button
      type="button"
      onClick={() => !isDraft && onSelectBlock(block.id)}
      onKeyDown={(event) => {
        if (isDraft) return;

        if (event.key === 'Backspace' || event.key === 'Delete') {
          event.preventDefault();
          onDeleteBlock(block);
        }
      }}
      style={getBlockStyle(block)}
      className={`absolute left-1 right-1 z-10 overflow-hidden rounded-lg border border-slate-300 px-2 py-1 text-left text-[11px] font-medium leading-tight transition ${
        selected
          ? 'bg-slate-300 text-slate-900 shadow-sm'
          : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
      }`}
    >
      {canResize && (
        <ResizeHandle edge="top" block={block} onStartResize={onStartResize} />
      )}

      <span className="pointer-events-none block pt-1">
        {block.from}–{block.to}
      </span>

      {canResize && (
        <ResizeHandle edge="bottom" block={block} onStartResize={onStartResize} />
      )}
    </button>
  );
}

function ResizeHandle({
  edge,
  block,
  onStartResize,
}: {
  edge: 'top' | 'bottom';
  block: TimeBlock;
  onStartResize: (
    block: TimeBlock,
    edge: 'top' | 'bottom',
    event: MouseEvent
  ) => void;
}) {
  const positionClass =
    edge === 'top'
      ? 'top-0'
      : 'bottom-0';

  return (
    <span
      onMouseDown={(event) => onStartResize(block, edge, event)}
      className={`absolute left-1 right-1 ${positionClass} h-1.5 cursor-ns-resize rounded-full bg-slate-900/20`}
    />
  );
}
