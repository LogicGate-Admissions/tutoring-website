'use client';

import { useState } from 'react';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { SearchableMultiSelect } from '@/shared/components/SearchableMultiSelect';
import {
  LEARNING_STYLE_OPTIONS,
  UNIVERSITY_OPTIONS,
} from '@/domains/students/learning-profile/constants/learningProfileOptions';
import { OptionCard } from '@/domains/students/learning-profile/components/OptionCard';
import { StudentOnboardingSectionBar } from '@/domains/students/learning-profile/components/StudentOnboardingSectionBar';
import {
  getStoredLearningProfile,
  updateStoredLearningProfile,
} from '@/domains/students/learning-profile/services/learningProfileStorage';

/**
 * Second student onboarding step.
 *
 * This captures matching preferences:
 * - how the student prefers to learn
 * - which university backgrounds they prefer tutors to have
 */
export function StudentPreferencesStep() {
  const storedProfile = getStoredLearningProfile();

  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    storedProfile.learningStyles
  );

  const [preferredUniversities, setPreferredUniversities] = useState<string[]>(
    storedProfile.preferredUniversities
  );

  function toggleStyle(style: string) {
    setSelectedStyles((currentStyles) =>
      currentStyles.includes(style)
        ? currentStyles.filter((item) => item !== style)
        : [...currentStyles, style]
    );
  }

  function addUniversity(university: string) {
    if (!university || preferredUniversities.includes(university)) return;

    setPreferredUniversities((currentUniversities) => [
      ...currentUniversities,
      university,
    ]);
  }

  function removeUniversity(university: string) {
    setPreferredUniversities((currentUniversities) =>
      currentUniversities.filter((item) => item !== university)
    );
  }

  function saveDraftProfile() {
    updateStoredLearningProfile({
      learningStyles: selectedStyles,
      preferredUniversities,
    });
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Student onboarding"
        title="What kind of tutor fits you?"
        description="Choose how you prefer to learn and whether you have a tutor university preference."
      />

      <Container className="grid gap-6 py-10 pb-28 lg:grid-cols-[1.1fr_0.9fr]">
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
                onToggle={() => toggleStyle(style.label)}
              />
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Preferred universities</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add universities you would prefer tutors to come from. You can
            leave this blank if you do not mind.
          </p>

          <div className="mt-5">
            <SearchableMultiSelect
              label="Search universities"
              options={[...UNIVERSITY_OPTIONS]}
              selectedOptions={preferredUniversities}
              getOptionKey={(university) => university}
              getOptionLabel={(university) => university}
              onSelect={addUniversity}
              onRemove={removeUniversity}
              emptyMessage="No universities found."
            />
          </div>
        </Card>
      </Container>

      <StudentOnboardingSectionBar
        currentStep="preferences"
        onBeforeNavigate={saveDraftProfile}
      />
    </main>
  );
}