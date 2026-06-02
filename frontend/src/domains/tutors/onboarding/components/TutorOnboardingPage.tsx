'use client';

/**
 * File purpose: Firebase-backed tutor onboarding page.
 *
 * This page coordinates the full tutor setup flow:
 * - confirm the signed-in tutor account
 * - load any existing tutor profile from Firestore
 * - collect profile basics, taught subjects, teaching styles, and availability
 * - save the structured tutor profile back into Firestore
 * - mark onboarding complete and route the tutor to their dashboard
 *
 * Small UI sections live in subfolders so this file stays focused on state and
 * saving rules instead of long chunks of repeated form markup.
 */

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/Button';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { ROUTES } from '@/shared/constants/routes';
import {
  markOnboardingComplete,
  subscribeToCurrentUser,
} from '@/domains/auth/services/authService';
import type { AuthUser } from '@/domains/auth/types/auth';
import { TutorProfileBasicsSection } from '@/domains/tutors/onboarding/components/profile/TutorProfileBasicsSection';
import { TutorTeachingStyleSection } from '@/domains/tutors/onboarding/components/profile/TutorTeachingStyleSection';
import { TutorTeachingSubjectsSection } from '@/domains/tutors/onboarding/components/subjects/TutorTeachingSubjectsSection';
import { TutorAvailabilitySection } from '@/domains/tutors/onboarding/components/availability/TutorAvailabilitySection';
import {
  EMPTY_TUTOR_PROFILE_DRAFT,
  getTutorProfileDraft,
  saveTutorProfileFromOnboarding,
  type TutorProfileDraft,
} from '@/domains/tutors/tutor-discovery/services/tutorProfileService';
import type {
  QualificationCategory,
  QualificationSubjectSelection,
  TimeBlock,
} from '@/domains/students/learning-profile/types/learningProfile';

/**
 * Tutor onboarding page.
 *
 * The page owns the draft object because the final save needs all sections at
 * once. Each child section receives only the slice of data it needs.
 */
export function TutorOnboardingPage() {
  const router = useRouter();
  const [currentTutor, setCurrentTutor] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<TutorProfileDraft>(
    EMPTY_TUTOR_PROFILE_DRAFT
  );
  const [activeCategory, setActiveCategory] = useState<QualificationCategory | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    /**
     * Subscribe to the current Firebase user.
     *
     * Auth state is asynchronous in the browser. We wait for Firebase to tell us
     * who is signed in before loading the tutor profile document.
     */
    const unsubscribe = subscribeToCurrentUser((user) => {
      const tutor = user?.role === 'tutor' ? user : null;

      setCurrentTutor(tutor);

      if (!tutor) {
        setIsLoadingProfile(false);
        return;
      }

      void loadTutorProfile(tutor);
    });

    return () => unsubscribe();
  }, []);

  async function loadTutorProfile(tutor: AuthUser) {
    setIsLoadingProfile(true);
    setError(null);

    try {
      /**
       * Load any existing Firestore profile so tutors can return to onboarding
       * later and edit what they previously saved.
       */
      const savedProfile = await getTutorProfileDraft(tutor.id);
      const displayName = savedProfile.displayName || tutor.name;
      const subjectSelections = savedProfile.subjectSelections;

      setProfile({
        ...savedProfile,
        displayName,
      });

      /**
       * Open the first selected qualification by default so the subject picker
       * immediately shows useful content when an existing profile loads.
       */
      setActiveCategory(subjectSelections[0]?.category ?? '');
    } catch {
      setError('Could not load your tutor profile. Please refresh and try again.');
    } finally {
      setIsLoadingProfile(false);
    }
  }

  function updateTextField(
    field: 'displayName' | 'headline' | 'university' | 'degree' | 'bio',
    value: string
  ) {
    /**
     * Keep basic text field updates small and predictable.
     *
     * A generic helper avoids duplicating setProfile blocks for every input.
     */
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
  }

  function updatePricePerHour(pricePerHour: number) {
    /**
     * Guard against an empty/invalid number input becoming NaN in Firestore.
     */
    if (!Number.isFinite(pricePerHour)) return;

    setProfile((currentProfile) => ({
      ...currentProfile,
      pricePerHour,
    }));
  }

  function updateSubjectSelections(
    subjectSelections: QualificationSubjectSelection[]
  ) {
    /**
     * Subject selections are structured by qualification. This keeps the tutor
     * profile compatible with student filters and future matching logic.
     */
    setProfile((currentProfile) => ({
      ...currentProfile,
      subjectSelections,
    }));
  }

  function toggleTeachingStyle(style: string) {
    /**
     * Teaching styles use the same labels as student learning preferences so
     * matching can compare arrays directly later.
     */
    setProfile((currentProfile) => {
      const selected = currentProfile.learningStyles.includes(style);

      return {
        ...currentProfile,
        learningStyles: selected
          ? currentProfile.learningStyles.filter((item) => item !== style)
          : [...currentProfile.learningStyles, style],
      };
    });
  }

  function updateAvailability(availability: TimeBlock[]) {
    /**
     * Availability is stored as structured TimeBlocks, not just display text.
     * The service later creates a short display summary for tutor cards.
     */
    setProfile((currentProfile) => ({
      ...currentProfile,
      availability,
    }));
  }

  function validateProfile() {
    /**
     * Required fields are intentionally minimal for now. We require enough data
     * for a useful tutor result card, but avoid blocking tutors on optional bio
     * or availability details during early development.
     */
    if (!profile.displayName.trim()) {
      return 'Please add your display name.';
    }

    if (!profile.headline.trim()) {
      return 'Please add a short tutor headline.';
    }

    const hasAtLeastOneSubject = profile.subjectSelections.some(
      (selection) => selection.subjects.length > 0
    );

    if (!hasAtLeastOneSubject) {
      return 'Please choose at least one qualification and subject you can teach.';
    }

    if (profile.learningStyles.length === 0) {
      return 'Please choose at least one teaching style.';
    }

    return null;
  }

  async function finishTutorOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!currentTutor) {
      setError('Please log in again before saving your tutor profile.');
      return;
    }

    const validationError = validateProfile();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      /**
       * Save the tutor profile before marking onboarding complete. That way, a
       * tutor cannot reach the dashboard while their public profile failed to
       * save.
       */
      await saveTutorProfileFromOnboarding(currentTutor, profile);

      /**
       * Once the Firestore profile exists, future tutor logins can go directly
       * to the dashboard instead of returning to onboarding.
       */
      await markOnboardingComplete(currentTutor.id);

      router.push(ROUTES.tutorDashboard);
    } catch {
      setError('Could not save your tutor profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Tutor onboarding"
        title="Set up your tutor profile"
        description="Add what you teach, how you teach, your availability, and the profile details students will see."
      />

      <Container className="py-10">
        <form onSubmit={finishTutorOnboarding} className="grid gap-8">
          {isLoadingProfile ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
              Loading your tutor profile...
            </div>
          ) : (
            <>
              <TutorProfileBasicsSection
                profile={profile}
                onChangeTextField={updateTextField}
                onChangePricePerHour={updatePricePerHour}
              />

              <TutorTeachingSubjectsSection
                subjectSelections={profile.subjectSelections}
                activeCategory={activeCategory}
                onChangeSubjectSelections={updateSubjectSelections}
                onChangeActiveCategory={setActiveCategory}
              />

              <TutorTeachingStyleSection
                selectedStyles={profile.learningStyles}
                onToggleStyle={toggleTeachingStyle}
              />

              <TutorAvailabilitySection
                availability={profile.availability}
                onChangeAvailability={updateAvailability}
              />
            </>
          )}

          {error && (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving || isLoadingProfile}>
              {isSaving ? 'Saving...' : 'Finish setup'}
            </Button>
          </div>
        </form>
      </Container>
    </main>
  );
}
