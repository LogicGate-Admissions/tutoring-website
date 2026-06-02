import {
  AVAILABILITY_PRESETS,
} from '@/domains/students/learning-profile/constants/learningProfileOptions';
import type {
  TimeBlock,
} from '@/domains/students/learning-profile/types/learningProfile';
import {
  blockFullyContains,
  blockTouchesOrOverlaps,
  createManualTimeBlock,
  mergeTimeBlocks,
  timeToMinutes,
} from '@/domains/students/learning-profile/utils/timeBlocks';

/**
 * Helpers for the availability onboarding step.
 *
 * StudentAvailabilityStep keeps these rules outside the React component so the
 * component reads like a UI flow, while this file explains the data rules:
 * presets generate blocks, manual blocks override/extend them, and the final
 * saved availability is always a merged list of visible blocks.
 */

export function blockCoversBlock(savedBlock: TimeBlock, targetBlock: TimeBlock) {
  if (savedBlock.day !== targetBlock.day) return false;

  return (
    timeToMinutes(savedBlock.from) <= timeToMinutes(targetBlock.from) &&
    timeToMinutes(savedBlock.to) >= timeToMinutes(targetBlock.to)
  );
}

/**
 * Re-highlight preset cards when a saved profile already covers all the blocks
 * created by that preset.
 */
export function getInitialSelectedPresetIds(savedAvailability: TimeBlock[]) {
  return AVAILABILITY_PRESETS.filter((preset) =>
    preset.blocks.every((presetBlock) =>
      savedAvailability.some((savedBlock) =>
        blockCoversBlock(savedBlock, presetBlock)
      )
    )
  ).map((preset) => preset.id);
}

/**
 * Convert selected preset IDs into the actual blocks that should appear on the
 * grid. This avoids storing duplicate preset blocks in React state.
 */
export function getPresetBlocks(selectedPresetIds: string[]) {
  return AVAILABILITY_PRESETS.filter((preset) =>
    selectedPresetIds.includes(preset.id)
  ).flatMap((preset) => preset.blocks);
}

/**
 * Remove one visible block from the final availability view.
 *
 * Important edge case:
 * A visible block may be the result of a preset and a manual block merging.
 * Deleting that visible block should not reveal the old preset underneath, so
 * we remove every preset/manual block that contributed to the visible block.
 */
export function removeVisibleAvailabilityBlock({
  blockToRemove,
  selectedPresetIds,
  customBlocks,
}: {
  blockToRemove: TimeBlock;
  selectedPresetIds: string[];
  customBlocks: TimeBlock[];
}) {
  const affectedPresets = AVAILABILITY_PRESETS.filter((preset) =>
    selectedPresetIds.includes(preset.id)
  ).filter((preset) =>
    preset.blocks.some((presetBlock) =>
      blockTouchesOrOverlaps(blockToRemove, presetBlock)
    )
  );

  const affectedPresetIds = affectedPresets.map((preset) => preset.id);

  /**
   * If a multi-day preset is affected, keep the days that were not inside the
   * deleted visible block. They become manual blocks because the original preset
   * card can no longer represent the partially edited selection accurately.
   */
  const unaffectedPresetBlocks = affectedPresets
    .flatMap((preset) => preset.blocks)
    .filter((presetBlock) => !blockFullyContains(blockToRemove, presetBlock))
    .map((presetBlock) =>
      createManualTimeBlock(presetBlock.day, presetBlock.from, presetBlock.to)
    );

  return {
    selectedPresetIds: selectedPresetIds.filter(
      (presetId) => !affectedPresetIds.includes(presetId)
    ),
    customBlocks: mergeTimeBlocks([
      ...customBlocks.filter(
        (customBlock) => !blockFullyContains(blockToRemove, customBlock)
      ),
      ...unaffectedPresetBlocks,
    ]),
  };
}

/**
 * Resizing a preset means the user has customised it, so it must become a
 * manual block. Otherwise the preset card would keep re-generating the old
 * block underneath the edited one.
 */
export function resizePresetAsManualBlock({
  blockToResize,
  from,
  to,
  selectedPresetIds,
  customBlocks,
}: {
  blockToResize: TimeBlock;
  from: string;
  to: string;
  selectedPresetIds: string[];
  customBlocks: TimeBlock[];
}) {
  const resizedManualBlock = createManualTimeBlock(blockToResize.day, from, to);

  const nextSelectedPresetIds = selectedPresetIds.filter((presetId) => {
    const preset = AVAILABILITY_PRESETS.find((item) => item.id === presetId);

    if (!preset) return false;

    return !preset.blocks.every((presetBlock) =>
      blockCoversBlock(blockToResize, presetBlock)
    );
  });

  const nextCustomBlocks = mergeTimeBlocks([
    ...customBlocks.filter(
      (block) => !blockFullyContains(blockToResize, block)
    ),
    resizedManualBlock,
  ]);

  return {
    resizedManualBlock,
    selectedPresetIds: nextSelectedPresetIds,
    customBlocks: nextCustomBlocks,
  };
}
