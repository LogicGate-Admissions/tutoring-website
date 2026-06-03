/**
 * File purpose: Small preferences UI/helper file used by the student learning profile flow.
 */

/**
 * Learning style preference section.
 *
 * This is separated from StudentPreferencesStep so that the page component only
 * coordinates state, while this file focuses on rendering the learning cards.
 */

import { Card } from '@/shared/components/Card';
import { OptionCard } from '@/domains/students/learning-profile/components/OptionCard';
import { LEARNING_STYLE_OPTIONS } from '@/domains/students/learning-profile/constants/learningProfileOptions';

type LearningStyleSectionProps = {
  selectedStyles: string[];
  onToggleStyle: (style: string) => void;
};

export function LearningStyleSection({
  selectedStyles,
  onToggleStyle,
}: LearningStyleSectionProps) {
  return (
    <Card>
      <h2 className="text-xl font-semibold">Learning style</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Select any styles that would make tutoring feel more useful for you.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {LEARNING_STYLE_OPTIONS.map((style) => (
          <OptionCard
            key={style.label}
            title={style.label}
            description={style.description}
            selected={selectedStyles.includes(style.label)}
            onToggle={() => onToggleStyle(style.label)}
          />
        ))}
      </div>
    </Card>
  );
}
