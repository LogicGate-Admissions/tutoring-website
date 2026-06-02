'use client';

/**
 * File purpose: Application source file. Comments explain what this file owns and what should stay elsewhere.
 */

/**
 * Student onboarding preferences page.
 *
 * This page owns the selected preference state and passes simple callbacks to
 * smaller section components. Keeping the page at this level makes it easier to
 * save Firestore profile data because all persistence happens through one service.
 */

import { useEffect, useState } from 'react';
import { HomeLinkButton } from '@/shared/components/HomeLinkButton';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { StudentOnboardingSectionBar } from '@/domains/students/learning-profile/components/StudentOnboardingSectionBar';
import { LearningStyleSection } from '@/domains/students/learning-profile/components/preferences/LearningStyleSection';
import { PreferredUniversitiesSection } from '@/domains/students/learning-profile/components/preferences/PreferredUniversitiesSection';
import {
  addUniqueValue,
  removeValue,
  toggleSelectedValue,
} from '@/domains/students/learning-profile/components/preferences/PreferenceSelectionHelpers';
import {
  getStoredLearningProfile,
  updateStoredLearningProfile,
} from '@/domains/students/learning-profile/services/learningProfileStorage';

export function StudentPreferencesStep() {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  const [preferredUniversities, setPreferredUniversities] = useState<string[]>(
    []
  );

  useEffect(() => {
    /**
     * Load saved preferences from Firestore after Firebase Auth is ready.
     * Starting from empty arrays keeps the first render safe and predictable.
     */
    let isMounted = true;

    async function loadProfile() {
      const profile = await getStoredLearningProfile();

      if (!isMounted) return;

      setSelectedStyles(profile.learningStyles);
      setPreferredUniversities(profile.preferredUniversities);
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  function toggleStyle(style: string) {
    /** Toggling is isolated in a helper so this handler stays self-explanatory. */
    setSelectedStyles((currentStyles) =>
      toggleSelectedValue(currentStyles, style)
    );
  }

  function addUniversity(university: string) {
    /** Add only if it is not already present. */
    setPreferredUniversities((currentUniversities) =>
      addUniqueValue(currentUniversities, university)
    );
  }

  function removeUniversity(university: string) {
    /** Remove by value rather than index because option order can change later. */
    setPreferredUniversities((currentUniversities) =>
      removeValue(currentUniversities, university)
    );
  }

  function saveDraftProfile() {
    /** Save partial progress whenever the student navigates away. */
    void updateStoredLearningProfile({
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

      <Container className="pt-4">
        <HomeLinkButton />
      </Container>

      <Container className="grid gap-6 py-10 pb-28 lg:grid-cols-[1.1fr_0.9fr]">
        <LearningStyleSection
          selectedStyles={selectedStyles}
          onToggleStyle={toggleStyle}
        />

        <PreferredUniversitiesSection
          preferredUniversities={preferredUniversities}
          onAddUniversity={addUniversity}
          onRemoveUniversity={removeUniversity}
        />
      </Container>

      <StudentOnboardingSectionBar
        currentStep="preferences"
        onBeforeNavigate={saveDraftProfile}
      />
    </main>
  );
}
