'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { ROUTES } from '@/shared/constants/routes';
import {
  QUALIFICATION_CATEGORIES,
  SUBJECT_OPTIONS_BY_CATEGORY,
} from '@/domains/students/learning-profile/constants/learningProfileOptions';
import { OptionCard } from '@/domains/students/learning-profile/components/OptionCard';
import {
  getStoredLearningProfile,
  updateStoredLearningProfile,
} from '@/domains/students/learning-profile/services/learningProfileStorage';
import type { QualificationCategory } from '@/domains/students/learning-profile/types/learningProfile';

/**
 * First student onboarding step.
 *
 * The output is not just UI state. It becomes part of the student's learning
 * profile, which tutor discovery uses to pre-fill filters later.
 */
export function StudentSubjectsStep() {
  const router = useRouter();
  const initialProfile = getStoredLearningProfile();
  const [category, setCategory] = useState<QualificationCategory | ''>(
    initialProfile.category
  );
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    initialProfile.subjects
  );

  const subjectOptions = useMemo(() => {
    if (!category) return [];
    return SUBJECT_OPTIONS_BY_CATEGORY[category];
  }, [category]);

  function chooseCategory(nextCategory: QualificationCategory) {
    setCategory(nextCategory);
    setSelectedSubjects([]);
  }

  function toggleSubject(subject: string) {
    setSelectedSubjects((currentSubjects) =>
      currentSubjects.includes(subject)
        ? currentSubjects.filter((item) => item !== subject)
        : [...currentSubjects, subject]
    );
  }

  function continueToPreferences() {
    updateStoredLearningProfile({ category, subjects: selectedSubjects });
    router.push(ROUTES.studentOnboardingPreferences);
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Student onboarding"
        title="What are you studying?"
        description="Choose your qualification and subjects. This makes tutor recommendations more relevant."
      />

      <Container className="grid gap-6 py-10 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="text-xl font-semibold">Qualification</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This controls which subject options appear next.
          </p>

          <div className="mt-5 grid gap-3">
            {QUALIFICATION_CATEGORIES.map((option) => (
              <OptionCard
                key={option}
                title={option}
                selected={category === option}
                onToggle={() => chooseCategory(option)}
              />
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Subjects</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Pick every subject you may need support with.
          </p>

          {!category && (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              Choose a qualification first.
            </div>
          )}

          {category && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {subjectOptions.map((subject) => (
                <OptionCard
                  key={subject}
                  title={subject}
                  selected={selectedSubjects.includes(subject)}
                  onToggle={() => toggleSubject(subject)}
                />
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <Button
              disabled={!category || selectedSubjects.length === 0}
              onClick={continueToPreferences}
            >
              Continue
            </Button>
          </div>
        </Card>
      </Container>
    </main>
  );
}
