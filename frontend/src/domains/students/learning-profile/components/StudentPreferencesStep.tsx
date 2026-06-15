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
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { ProfilePhotoUploader } from '@/shared/components/ProfilePhotoUploader';
import {
  StudentOnboardingFlowControls,
  StudentOnboardingSectionBar,
} from '@/domains/students/learning-profile/components/StudentOnboardingSectionBar';
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
import { subscribeToCurrentUser } from '@/domains/auth/services/authService';

export function StudentPreferencesStep() {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [preferredUniversities, setPreferredUniversities] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [currentStudentId, setCurrentStudentId] = useState<string | undefined>();

  useEffect(() => {
    const unsubscribe = subscribeToCurrentUser((user) => {
      setCurrentStudentId(user?.role === 'student' ? user.id : undefined);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    /**
     * Load saved preferences from Firestore after Firebase Auth is ready.
     * Starting from empty arrays/strings keeps the first render safe and predictable.
     */
    let isMounted = true;

    async function loadProfile() {
      const profile = await getStoredLearningProfile();

      if (!isMounted) return;

      setSelectedStyles(profile.learningStyles);
      setPreferredUniversities(profile.preferredUniversities);
      setBio(profile.bio);
      setPhotoUrl(profile.photoUrl ?? '');
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
      bio,
      photoUrl,
    });
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Student onboarding"
        title="What kind of tutor fits you?"
        description="Choose how you prefer to learn, add a short learning note, and tell us whether you have a tutor university preference."
      />

      <StudentOnboardingSectionBar
        currentStep="preferences"
        onBeforeNavigate={saveDraftProfile}
      />

      <Container className="grid gap-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Face photo
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Help your tutor recognise you
            </h2>
            <div className="mt-5">
              <ProfilePhotoUploader
                userId={currentStudentId}
                name="Student"
                photoUrl={photoUrl}
                helperText="This face photo appears for tutors in requests, messages, and student profile previews."
                onUploaded={setPhotoUrl}
              />
            </div>
          </section>

          <LearningStyleSection
            selectedStyles={selectedStyles}
            onToggleStyle={toggleStyle}
          />

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              About your learning
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              What should a tutor know about you?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add a short note about what you find difficult, how you like explanations, or what you want sessions to focus on.
            </p>

            <label className="mt-5 grid gap-2 text-sm font-medium text-slate-800" htmlFor="student-bio">
              About me
              <textarea
                id="student-bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={5}
                maxLength={700}
                placeholder="Example: I understand visual explanations best, but I struggle to know where to start on longer exam questions. I want a tutor who can break questions down step by step."
                className="min-h-32 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <p className="mt-2 text-xs text-slate-500">{bio.length}/700 characters</p>
          </section>
        </div>

        <PreferredUniversitiesSection
          preferredUniversities={preferredUniversities}
          onAddUniversity={addUniversity}
          onRemoveUniversity={removeUniversity}
        />
      </Container>

      <StudentOnboardingFlowControls
        currentStep="preferences"
        onBeforeNavigate={saveDraftProfile}
      />
    </main>
  );
}
