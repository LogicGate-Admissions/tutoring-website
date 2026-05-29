import { MouseEvent, useMemo, useRef, useState } from 'react';
import { Day, days, TimeBlock } from '../../lib/timeOptions';
import {
  findBlockCoveringTime,
  minutesToTime,
  snapMinutesToThirty,
  timeToMinutes,
} from '../../lib/timeUtils';

type AvailabilityGridProps = {
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

const totalDayMinutes = 24 * 60;
const slotMinutes = 30;
const slotHeight = 28;

const slots = Array.from({ length: totalDayMinutes / slotMinutes }, (_, index) =>
  minutesToTime(index * slotMinutes)
);

function blockStyle(block: TimeBlock) {
  const start = timeToMinutes(block.from);
  const end = timeToMinutes(block.to);

  return {
    top: `${(start / totalDayMinutes) * 100}%`,
    height: `${((end - start) / totalDayMinutes) * 100}%`,
  };
}

function normaliseRange(start: number, end: number) {
  const from = Math.min(start, end);
  const to = Math.max(start, end) + slotMinutes;

  return {
    from: minutesToTime(from),
    to: minutesToTime(Math.min(to, totalDayMinutes)),
  };
}

export default function AvailabilityGrid({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onAddTimeRange,
  onDeleteBlock,
  onResizeBlock,
}: AvailabilityGridProps) {
  const columnRefs = useRef<Partial<Record<Day, HTMLDivElement>>>({});
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
        source: 'grid' as const,
      }
    : null;

  function getMinutesFromMouse(day: Day, event: MouseEvent | globalThis.MouseEvent) {
    const column = columnRefs.current[day];

    if (!column) {
      return 0;
    }

    const rect = column.getBoundingClientRect();
    const relativeY = event.clientY - rect.top;
    const rawMinutes = (relativeY / rect.height) * totalDayMinutes;
    const snapped = snapMinutesToThirty(rawMinutes);

    return Math.max(0, Math.min(totalDayMinutes, snapped));
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

    setDragCreate((current) =>
      current
        ? {
            ...current,
            endMinutes: timeToMinutes(slot),
          }
        : current
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

  function startResize(block: TimeBlock, edge: 'top' | 'bottom', event: MouseEvent) {
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

    setResizeDraft((current) => {
      if (!current) {
        return current;
      }

      const currentFrom = timeToMinutes(current.from);
      const currentTo = timeToMinutes(current.to);

      if (current.edge === 'top') {
        const newFrom = Math.min(mouseMinutes, currentTo - slotMinutes);

        return {
          ...current,
          from: minutesToTime(newFrom),
        };
      }

      const newTo = Math.max(mouseMinutes, currentFrom + slotMinutes);

      return {
        ...current,
        to: minutesToTime(newTo),
      };
    });
  }

  return (
    <div
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="rounded-[1.75rem] border-2 border-slate-950 bg-white p-5 shadow-[6px_6px_0_#0f172a]"
    >
      <div className="max-h-[640px] overflow-auto rounded-2xl border-2 border-slate-950 bg-slate-50">
        <div className="sticky top-0 z-20 grid grid-cols-[72px_repeat(7,minmax(88px,1fr))] border-b-2 border-slate-950 bg-white">
          <div className="border-r-2 border-slate-950 p-2 text-xs font-bold text-slate-500">
            Time
          </div>

          {days.map((day) => (
            <div
              key={day}
              className="border-r-2 border-slate-950 p-2 text-center text-sm font-bold last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[72px_repeat(7,minmax(88px,1fr))]">
          <div>
            {slots.map((slot) => (
              <div
                key={slot}
                style={{ height: slotHeight }}
                className="border-b border-slate-200 pr-2 text-right text-[11px] font-semibold text-slate-500"
              >
                {slot.endsWith(':00') ? slot : ''}
              </div>
            ))}
          </div>

          {days.map((day) => (
            <div
              key={day}
              ref={(element) => {
                if (element) {
                  columnRefs.current[day] = element;
                }
              }}
              onMouseMove={(event) => handleColumnMouseMove(day, event)}
              className="relative border-l border-slate-200"
              style={{ height: slots.length * slotHeight }}
            >
              {slots.map((slot) => (
                <button
                  key={`${day}-${slot}`}
                  type="button"
                  onMouseDown={() => handleSlotMouseDown(day, slot)}
                  onMouseEnter={() => handleSlotMouseEnter(day, slot)}
                  className="absolute left-0 w-full border-b border-slate-200 hover:bg-cyan-50"
                  style={{
                    top: timeToMinutes(slot) * (slotHeight / slotMinutes),
                    height: slotHeight,
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
                      className={`absolute left-1 right-1 z-10 overflow-hidden rounded-xl border-2 border-slate-950 px-2 py-1 text-left text-[11px] font-bold leading-tight transition ${
                        selected
                          ? 'bg-cyan-200 shadow-[3px_3px_0_#0f172a]'
                          : 'bg-cyan-100 hover:bg-cyan-200'
                      }`}
                    >
                      {!isDraft && (
                        <span
                          onMouseDown={(event) => startResize(block, 'top', event)}
                          className="absolute left-1 right-1 top-0 h-2 cursor-ns-resize rounded-full bg-slate-950/20"
                        />
                      )}

                      <span className="pointer-events-none block pt-1">
                        {block.from}–{block.to}
                      </span>

                      {!isDraft && (
                        <span
                          onMouseDown={(event) => startResize(block, 'bottom', event)}
                          className="absolute bottom-0 left-1 right-1 h-2 cursor-ns-resize rounded-full bg-slate-950/20"
                        />
                      )}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        Drag across empty 30-minute slots to create a block. Drag the top or bottom edge
        of a block to resize it. Right-click a block to delete it.
      </p>
    </div>
  );
}