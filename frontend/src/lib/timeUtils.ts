import { Day, TimeBlock } from './timeOptions';

export function makeId() {
  return crypto.randomUUID();
}

export function isValidTime(time: string) {
  return /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/.test(time);
}

export function timeToMinutes(time: string) {
  if (time === '24:00') {
    return 24 * 60;
  }

  const [hours, minutes] = time.split(':').map(Number);

  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number) {
  const clampedMinutes = Math.max(0, Math.min(24 * 60, totalMinutes));
  const hours = Math.floor(clampedMinutes / 60);
  const minutes = clampedMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function addMinutes(time: string, minutesToAdd: number) {
  return minutesToTime(timeToMinutes(time) + minutesToAdd);
}

export function snapMinutesToThirty(minutes: number) {
  return Math.round(minutes / 30) * 30;
}

export function blockOverlaps(a: TimeBlock, b: TimeBlock) {
  if (a.day !== b.day) {
    return false;
  }

  const aStart = timeToMinutes(a.from);
  const aEnd = timeToMinutes(a.to);
  const bStart = timeToMinutes(b.from);
  const bEnd = timeToMinutes(b.to);

  return aStart < bEnd && bStart < aEnd;
}

export function blockTouchesOrOverlaps(a: TimeBlock, b: TimeBlock) {
  if (a.day !== b.day) {
    return false;
  }

  const aStart = timeToMinutes(a.from);
  const aEnd = timeToMinutes(a.to);
  const bStart = timeToMinutes(b.from);
  const bEnd = timeToMinutes(b.to);

  return aStart <= bEnd && bStart <= aEnd;
}

export function blockFullyContains(existing: TimeBlock, newBlock: TimeBlock) {
  if (existing.day !== newBlock.day) {
    return false;
  }

  return (
    timeToMinutes(existing.from) <= timeToMinutes(newBlock.from) &&
    timeToMinutes(existing.to) >= timeToMinutes(newBlock.to)
  );
}

export function mergeBlockIntoBlocks(blocks: TimeBlock[], newBlock: TimeBlock) {
  const containingBlock = blocks.find((block) => blockFullyContains(block, newBlock));

  if (containingBlock) {
    return blocks;
  }

  const mergeableBlocks = blocks.filter((block) => blockTouchesOrOverlaps(block, newBlock));
  const untouchedBlocks = blocks.filter((block) => !blockTouchesOrOverlaps(block, newBlock));

  if (mergeableBlocks.length === 0) {
    return [...blocks, newBlock];
  }

  const mergedStart = Math.min(
    timeToMinutes(newBlock.from),
    ...mergeableBlocks.map((block) => timeToMinutes(block.from))
  );

  const mergedEnd = Math.max(
    timeToMinutes(newBlock.to),
    ...mergeableBlocks.map((block) => timeToMinutes(block.to))
  );

  const mergedBlock: TimeBlock = {
    id: mergeableBlocks[0].id,
    day: newBlock.day,
    from: minutesToTime(mergedStart),
    to: minutesToTime(mergedEnd),
    source: mergeableBlocks.some((block) => block.source === 'manual') ? 'manual' : newBlock.source,
  };

  return [...untouchedBlocks, mergedBlock];
}

export function mergeAllBlocks(blocks: TimeBlock[]) {
  return blocks
    .sort((a, b) => {
      if (a.day !== b.day) {
        return a.day.localeCompare(b.day);
      }

      return timeToMinutes(a.from) - timeToMinutes(b.from);
    })
    .reduce<TimeBlock[]>((mergedBlocks, block) => {
      return mergeBlockIntoBlocks(mergedBlocks, block);
    }, []);
}

export function findBlockCoveringTime(blocks: TimeBlock[], day: Day, time: string) {
  const minutes = timeToMinutes(time);

  return blocks.find((block) => {
    if (block.day !== day) {
      return false;
    }

    return timeToMinutes(block.from) <= minutes && minutes < timeToMinutes(block.to);
  });
}