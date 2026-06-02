'use client';

/**
 * File purpose: Firebase-backed tutor onboarding page.
 *
 * The tutor onboarding flow mirrors student onboarding as tabs, but it keeps a
 * single draft object because the final Firestore tutor profile needs all
 * sections together. The master subject list comes from academicOptionsService
 * so tutor and student onboarding use the same source of truth.
 */

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/Button';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';
import {
  markOnboardingComplete,
  subscribeToCurrentUser,
} from '@/domains/auth/services/authService';
import type { AuthUser } from '@/domains/auth/types/auth';
import { getSubjectOptionsByCategory } from '@/domains/academic-options/services/academicOptionsService';
import type { SubjectOptionsByCategory } from '@/domains/academic-options/types/academicOptions';
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
import type { TutorSubjectRate } from '@/domains/tutors/tutor-discovery/types/tutor';
import type {
  QualificationCategory,
  QualificationSubjectSelection,
  TimeBlock,
} from '@/domains/students/learning-profile/types/learningProfile';

type TutorOnboardingTab = 'subjects' | 'style' | 'availability' | 'profile';

type TutorOnboardingTabItem = {
  id: TutorOnboardingTab;
  label: string;
  description: string;
};

/** Tabs shown throughout tutor onboarding. */
const TUTOR_ONBOARDING_TABS: TutorOnboardingTabItem[] = [
  {
    id: 'subjects',
    label: 'Subjects',
    description: 'Qualifications, subjects, and per-subject rates',
  },
  {
    id: 'style',
    label: 'Style',
    description: 'How you teach and support students',
  },
  {
    id: 'availability',
    label: 'Availability',
    description: 'When students can request sessions',
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Public tutor details and final save',
  },
];

/** Tutor onboarding page. */
export function TutorOnboardingPage() {
  const router = useRouter();
  const [currentTutor, setCurrentTutor] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<TutorProfileDraft>(
    EMPTY_TUTOR_PROFILE_DRAFT
  );
  const [activeTab, setActiveTab] = useState<TutorOnboardingTab>('subjects');
  const [activeCategory, setActiveCategory] = useState<QualificationCategory | ''>('');
  const [subjectOptionsByCategory, setSubjectOptionsByCategory] =
    useState<SubjectOptionsByCategory>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    /** Load shared academic subject options used by student and tutor onboarding. */
    let isMounted = true;

    async function loadAcademicSubjects() {
      setIsLoadingSubjects(true);

      try {
        const options = await getSubjectOptionsByCategory();

        if (isMounted) {
          setSubjectOptionsByCategory(options);
        }
      } catch {
        if (isMounted) {
          setError('Could not load subject options. Please refresh the page.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingSubjects(false);
        }
      }
    }

    void loadAcademicSubjects();

    return () => {
      isMounted = false;
    };
  }, []);

  async function loadTutorProfile(tutor: AuthUser) {
    setIsLoadingProfile(true);
    setError(null);

    try {
      /** Load an existing Firestore profile so onboarding can be edited later. */
      const savedProfile = await getTutorProfileDraft(tutor.id);
      const displayName = savedProfile.displayName || tutor.name;
      const subjectSelections = savedProfile.subjectSelections;

      setProfile({
        ...savedProfile,
        displayName,
      });

      /** Open the first selected qualification when returning to onboarding. */
      setActiveCategory(subjectSelections[0]?.category ?? '');
    } catch {
      setError('Could not load your tutor profile. Please refresh and try again.');
    } finally {
      setIsLoadingProfile(false);
    }
  }

  useEffect(() => {
    /** Subscribe to Firebase Auth before loading the tutor's profile document. */
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

  function updateTextField(
    field: 'displayName' | 'headline' | 'university' | 'degree' | 'bio',
    value: string
  ) {
    /** Basic profile fields update one string field at a time. */
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
  }

  function updateSubjectSelections(subjectSelections: QualificationSubjectSelection[]) {
    /** The subject section owns selection rules; the parent stores the result. */
    setProfile((currentProfile) => ({
      ...currentProfile,
      subjectSelections,
    }));
  }

  function updateSubjectRates(subjectRates: TutorSubjectRate[]) {
    /** Rates stay aligned to selected subjects inside TutorTeachingSubjectsSection. */
    setProfile((currentProfile) => ({
      ...currentProfile,
      subjectRates,
    }));
  }

  function toggleTeachingStyle(style: string) {
    /** Teaching styles reuse student learning style labels for direct matching. */
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
    /** Store structured blocks so future booking can reason about real times. */
    setProfile((currentProfile) => ({
      ...currentProfile,
      availability,
    }));
  }

  function hasAtLeastOneSubject() {
    return profile.subjectSelections.some(
      (selection) => selection.subjects.length > 0
    );
  }

  function hasRatesForEverySelectedSubject() {
    const selectedPairs = profile.subjectSelections.flatMap((selection) =>
      selection.subjects.map((subject) => ({
        qualification: selection.category,
        subject,
      }))
    );

    return selectedPairs.every((pair) =>
      profile.subjectRates.some(
        (rate) =>
          rate.qualification === pair.qualification &&
          rate.subject === pair.subject &&
          Number.isFinite(rate.pricePerHour) &&
          rate.pricePerHour > 0
      )
    );
  }

  function validateProfile() {
    /** Keep validation focused on the data needed for a usable public profile. */
    if (!profile.displayName.trim()) {
      setActiveTab('profile');
      return 'Please add your display name.';
    }

    if (!profile.headline.trim()) {
      setActiveTab('profile');
      return 'Please add a short tutor headline.';
    }

    if (!hasAtLeastOneSubject()) {
      setActiveTab('subjects');
      return 'Please choose at least one qualification and subject you can teach.';
    }

    if (!hasRatesForEverySelectedSubject()) {
      setActiveTab('subjects');
      return 'Please add a rate above £0 for each subject you teach.';
    }

    if (profile.learningStyles.length === 0) {
      setActiveTab('style');
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
      /** Save profile first, then mark onboarding complete. */
      await saveTutorProfileFromOnboarding(currentTutor, profile);
      await markOnboardingComplete(currentTutor.id);
      router.push(ROUTES.tutorDashboard);
    } catch {
      setError('Could not save your tutor profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function renderActiveTab() {
    if (activeTab === 'subjects') {
      return (
        <TutorTeachingSubjectsSection
          subjectSelections={profile.subjectSelections}
          subjectRates={profile.subjectRates}
          activeCategory={activeCategory}
          subjectOptionsByCategory={subjectOptionsByCategory}
          isLoadingSubjects={isLoadingSubjects}
          onChangeSubjectSelections={updateSubjectSelections}
          onChangeSubjectRates={updateSubjectRates}
          onChangeActiveCategory={setActiveCategory}
        />
      );
    }

    if (activeTab === 'style') {
      return (
        <TutorTeachingStyleSection
          selectedStyles={profile.learningStyles}
          onToggleStyle={toggleTeachingStyle}
        />
      );
    }

    if (activeTab === 'availability') {
      return (
        <TutorAvailabilitySection
          availability={profile.availability}
          onChangeAvailability={updateAvailability}
        />
      );
    }

    return (
      <TutorProfileBasicsSection
        profile={profile}
        onChangeTextField={updateTextField}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Tutor onboarding"
        title="Set up your tutor profile"
        description="Use the tabs to add what you teach, how you teach, when you are free, and what students will see."
      />

      <Container className="py-10">
        <form onSubmit={finishTutorOnboarding} className="grid gap-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
            <div className="grid gap-2 md:grid-cols-4">
              {TUTOR_ONBOARDING_TABS.map((tab) => {
                const isActive = tab.id === activeTab;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'rounded-2xl px-4 py-3 text-left transition',
                      isActive
                        ? 'bg-slate-950 text-white'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <span className="block text-sm font-semibold">{tab.label}</span>
                    <span
                      className={cn(
                        'mt-1 block text-xs leading-5',
                        isActive ? 'text-slate-300' : 'text-slate-500'
                      )}
                    >
                      {tab.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {isLoadingProfile ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
              Loading your tutor profile...
            </div>
          ) : (
            renderActiveTab()
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
