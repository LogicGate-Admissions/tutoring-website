'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { ROUTES } from '@/shared/constants/routes';
import { LEARNING_STYLE_OPTIONS } from '@/domains/students/learning-profile/constants/learningProfileOptions';
import { OptionCard } from '@/domains/students/learning-profile/components/OptionCard';
import {
  getStoredLearningProfile,
  updateStoredLearningProfile,
} from '@/domains/students/learning-profile/services/learningProfileStorage';

/**
 * Second student onboarding step.
 *
 * This captures how the student prefers to learn, not just what they study.
 */
export function StudentPreferencesStep() {
  const router = useRouter();
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    getStoredLearningProfile().learningStyles
  );

  function toggleStyle(style: string) {
    setSelectedStyles((currentStyles) =>
      currentStyles.includes(style)
        ? currentStyles.filter((item) => item !== style)
        : [...currentStyles, style]
    );
  }

  function continueToAvailability() {
    updateStoredLearningProfile({ learningStyles: selectedStyles });
    router.push(ROUTES.studentOnboardingAvailability);
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Student onboarding"
        title="How do you prefer to learn?"
        description="Learning style matters because students often feel stuck when tutor support feels like school all over again."
      />

      <Container className="py-10">
        <Card>
          <div className="grid gap-3 md:grid-cols-2">
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

          <div className="mt-8 flex justify-end">
            <Button disabled={selectedStyles.length === 0} onClick={continueToAvailability}>
              Continue
            </Button>
          </div>
        </Card>
      </Container>
    </main>
  );
}
