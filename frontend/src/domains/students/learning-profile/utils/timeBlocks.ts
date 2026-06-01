import type { Day, TimeBlock } from '@/domains/students/learning-profile/types/learningProfile';

export function makeTimeBlockId() {
  return crypto.randomUUID();
}

export function timeBlockLabel(block: TimeBlock) {
  return `${block.day} ${block.from}–${block.to}`;
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function blockTouchesOrOverlaps(a: TimeBlock, b: TimeBlock) {
  if (a.day !== b.day) return false;

  const aStart = timeToMinutes(a.from);
  const aEnd = timeToMinutes(a.to);
  const bStart = timeToMinutes(b.from);
  const bEnd = timeToMinutes(b.to);

  return aStart <= bEnd && bStart <= aEnd;
}

/**
 * Merges touching/overlapping blocks so availability stays readable.
 */
export function mergeTimeBlocks(blocks: TimeBlock[]) {
  return [...blocks]
    .sort((a, b) => {
      if (a.day !== b.day) return a.day.localeCompare(b.day);
      return timeToMinutes(a.from) - timeToMinutes(b.from);
    })
    .reduce<TimeBlock[]>((mergedBlocks, block) => {
      const lastBlock = mergedBlocks.at(-1);

      if (!lastBlock || !blockTouchesOrOverlaps(lastBlock, block)) {
        return [...mergedBlocks, block];
      }

      return [
        ...mergedBlocks.slice(0, -1),
        {
          ...lastBlock,
          from: timeToMinutes(lastBlock.from) <= timeToMinutes(block.from) ? lastBlock.from : block.from,
          to: timeToMinutes(lastBlock.to) >= timeToMinutes(block.to) ? lastBlock.to : block.to,
        },
      ];
    }, []);
}

export function createManualTimeBlock(day: Day, from: string, to: string): TimeBlock {
  return {
    id: makeTimeBlockId(),
    day,
    from,
    to,
    source: 'manual',
  };
}
