/**
 * File purpose: Render tutor teaching style choices.
 *
 * Students use the same option list as learning preferences. Tutors use it to
 * describe how they teach. Matching can then compare student preferences with
 * tutor teaching styles using the same labels.
 */

import { Card } from '@/shared/components/Card';
import { OptionCard } from '@/domains/students/learning-profile/components/OptionCard';
import { LEARNING_STYLE_OPTIONS } from '@/domains/students/learning-profile/constants/learningProfileOptions';

type TutorTeachingStyleSectionProps = {
  /** Teaching styles currently selected by the tutor. */
  selectedStyles: string[];

  /** Adds or removes one teaching style from the tutor profile draft. */
  onToggleStyle: (style: string) => void;
};

export function TutorTeachingStyleSection({
  selectedStyles,
  onToggleStyle,
}: TutorTeachingStyleSectionProps) {
  return (
    <Card>
      <h2 className="text-xl font-semibold">Teaching style</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Select the methods you are comfortable using in lessons. These match the
        learning-style preferences students choose during onboarding.
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
