'use client';

/**
 * File purpose: Firebase-backed tutor onboarding page.
 *
 * Tutor onboarding mirrors student onboarding: tabs are used for direct section
 * navigation, while Back / Next / Finish buttons provide a guided flow.
 */

import { FormEvent, useCallback, useEffect, useState } from 'react';
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
import { TutorAvailabilitySection } from '@/domains/tutors/onboarding/components/availability/TutorAvailabilitySection';
import { TutorProfileBasicsSection } from '@/domains/tutors/onboarding/components/profile/TutorProfileBasicsSection';
import { TutorTeachingStyleSection } from '@/domains/tutors/onboarding/components/profile/TutorTeachingStyleSection';
import { TutorTeachingSubjectsSection } from '@/domains/tutors/onboarding/components/subjects/TutorTeachingSubjectsSection';
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
    description: 'Qualifications, subjects, and rates',
  },
  {
    id: 'style',
    label: 'Style',
    description: 'How you teach students',
  },
  {
    id: 'availability',
    label: 'Availability',
    description: 'When students can request you',
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Public tutor details',
  },
];

const TUTOR_TAB_ORDER: TutorOnboardingTab[] = [
  'subjects',
  'style',
  'availability',
  'profile',
];

function getTabIndex(tab: TutorOnboardingTab) {
  return TUTOR_TAB_ORDER.indexOf(tab);
}

function getPreviousTab(tab: TutorOnboardingTab) {
  return TUTOR_TAB_ORDER[getTabIndex(tab) - 1] ?? null;
}

function getNextTab(tab: TutorOnboardingTab) {
  return TUTOR_TAB_ORDER[getTabIndex(tab) + 1] ?? null;
}

/** Tutor onboarding page. */
export function TutorOnboardingPage() {
  const router = useRouter();
  const [currentTutor, setCurrentTutor] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<TutorProfileDraft>(
    EMPTY_TUTOR_PROFILE_DRAFT
  );
  const [activeTab, setActiveTab] = useState<TutorOnboardingTab>('subjects');
  const [activeCategory, setActiveCategory] = useState<QualificationCategory | ''>(
    ''
  );
  const [subjectOptionsByCategory, setSubjectOptionsByCategory] =
    useState<SubjectOptionsByCategory>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadTutorProfile = useCallback(async (tutor: AuthUser) => {
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
  }, []);

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
  }, [loadTutorProfile]);

  function updateTextField(
    field: 'displayName' | 'headline' | 'university' | 'degree' | 'bio' | 'photoUrl',
    value: string
  ) {
    if (error) setError(null);

    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
  }

  function updateSubjectSelections(
    subjectSelections: QualificationSubjectSelection[]
  ) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      subjectSelections,
    }));
  }

  function updateSubjectRates(subjectRates: TutorSubjectRate[]) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      subjectRates,
    }));
  }

  function toggleTeachingStyle(style: string) {
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

  async function finishTutorOnboarding() {
    setError(null);

    if (activeTab !== 'profile') {
      setActiveTab('profile');
      return;
    }

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


  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (activeTab !== 'profile') {
      setError(null);
      setActiveTab(getNextTab(activeTab) ?? 'profile');
      return;
    }

    void finishTutorOnboarding();
  }

  function goBack() {
    const previousTab = getPreviousTab(activeTab);

    if (previousTab) {
      setError(null);
      setActiveTab(previousTab);
    }
  }

  function goForward() {
    if (activeTab !== 'profile') {
      setError(null);
      setActiveTab(getNextTab(activeTab) ?? 'profile');
      return;
    }

    void finishTutorOnboarding();
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
        userId={currentTutor?.id}
        onChangeTextField={updateTextField}
      />
    );
  }

  const previousTab = getPreviousTab(activeTab);
  const isFinalTab = !getNextTab(activeTab);

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Tutor onboarding"
        title="Set up your tutor profile"
        description="Use the tabs to add what you teach, how you teach, when you are free, and what students will see."
      />

      <Container className="py-10 pb-28">
        <form onSubmit={handleFormSubmit} className="grid gap-8">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
            <div className="grid gap-2 md:grid-cols-4">
              {TUTOR_ONBOARDING_TABS.map((tab) => {
                const isActive = tab.id === activeTab;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setError(null);
                      setActiveTab(tab.id);
                    }}
                    className={cn(
                      'rounded-2xl px-4 py-3 text-left transition',
                      isActive
                        ? 'bg-slate-950 text-white'
                        : 'text-slate-700 hover:bg-white'
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

          <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            {previousTab ? (
              <Button type="button" variant="secondary" onClick={goBack}>
                Back
              </Button>
            ) : (
              <span aria-hidden="true" />
            )}

            {isFinalTab ? (
              <Button type="submit" disabled={isSaving || isLoadingProfile}>
                {isSaving ? 'Saving...' : 'Finish'}
              </Button>
            ) : (
              <Button type="button" onClick={goForward}>
                Next
              </Button>
            )}
          </div>
        </form>
      </Container>
    </main>
  );
}
