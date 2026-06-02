import { OptionCard } from '@/domains/students/learning-profile/components/OptionCard';
import { AVAILABILITY_PRESETS } from '@/domains/students/learning-profile/constants/learningProfileOptions';

/**
 * Preset card list.
 *
 * Kept separate from StudentAvailabilityStep so the main step can focus on the
 * overall flow instead of the repeated card markup.
 */
export function AvailabilityPresetList({
  selectedPresetIds,
  onTogglePreset,
}: {
  selectedPresetIds: string[];
  onTogglePreset: (presetId: string) => void;
}) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {AVAILABILITY_PRESETS.map((preset) => (
        <OptionCard
          key={preset.id}
          title={preset.label}
          description={preset.description}
          selected={selectedPresetIds.includes(preset.id)}
          onToggle={() => onTogglePreset(preset.id)}
        />
      ))}
    </div>
  );
}
