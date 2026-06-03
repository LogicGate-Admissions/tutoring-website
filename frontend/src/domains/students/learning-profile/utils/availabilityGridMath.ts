/**
 * File purpose: Pure learning-profile helper logic. Keep this free from React so it is easy to test.
 */

import type { TimeBlock } from '@/domains/students/learning-profile/types/learningProfile';
import {
  minutesToTime,
  snapMinutesToThirty,
  timeToMinutes,
} from '@/domains/students/learning-profile/utils/timeBlocks';

/**
 * Grid sizing constants are centralised here so the timetable maths is not
 * scattered through the React component.
 */
export const TOTAL_DAY_MINUTES = 24 * 60;
export const SLOT_MINUTES = 30;
export const SLOT_HEIGHT = 24;

export const TIME_SLOTS = Array.from(
  { length: TOTAL_DAY_MINUTES / SLOT_MINUTES },
  (_, index) => minutesToTime(index * SLOT_MINUTES)
);

export function getBlockStyle(block: TimeBlock) {
  const start = timeToMinutes(block.from);
  const end = timeToMinutes(block.to);

  return {
    top: `${(start / TOTAL_DAY_MINUTES) * 100}%`,
    height: `${((end - start) / TOTAL_DAY_MINUTES) * 100}%`,
  };
}

export function normaliseGridRange(start: number, end: number) {
  const from = Math.min(start, end);
  const to = Math.max(start, end) + SLOT_MINUTES;

  return {
    from: minutesToTime(from),
    to: minutesToTime(Math.min(to, TOTAL_DAY_MINUTES)),
  };
}

export function getSlotTop(slot: string) {
  return timeToMinutes(slot) * (SLOT_HEIGHT / SLOT_MINUTES);
}

export function snapMouseYToGridMinutes({
  clientY,
  columnTop,
  columnHeight,
}: {
  clientY: number;
  columnTop: number;
  columnHeight: number;
}) {
  const relativeY = clientY - columnTop;
  const rawMinutes = (relativeY / columnHeight) * TOTAL_DAY_MINUTES;
  const snappedMinutes = snapMinutesToThirty(rawMinutes);

  return Math.max(0, Math.min(TOTAL_DAY_MINUTES, snappedMinutes));
}
