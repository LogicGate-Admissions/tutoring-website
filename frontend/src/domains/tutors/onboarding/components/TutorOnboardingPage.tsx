'use client';

/**
 * File purpose: Firebase-backed tutor onboarding page.
 *
 * For now this captures the first public tutor-profile fields. Saving writes to
 * Firestore so the tutor can appear in student discovery without hardcoded data.
 */

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { ROUTES } from '@/shared/constants/routes';
import {
  markOnboardingComplete,
  subscribeToCurrentUser,
} from '@/domains/auth/services/authService';
import type { AuthUser } from '@/domains/auth/types/auth';
import {
  saveTutorProfileFromOnboarding,
  type TutorProfileDraft,
} from '@/domains/tutors/tutor-discovery/services/tutorProfileService';

const EMPTY_PROFILE: TutorProfileDraft = {
  displayName: '',
  headline: '',
  subjects: '',
  levels: '',
  learningStyles: '',
  university: '',
  degree: '',
  pricePerHour: 25,
};

export function TutorOnboardingPage() {
  const router = useRouter();
  const [currentTutor, setCurrentTutor] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<TutorProfileDraft>(EMPTY_PROFILE);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    /** Load the signed-in tutor so the profile can be saved under their uid. */
    const unsubscribe = subscribeToCurrentUser((user) => {
      const tutor = user?.role === 'tutor' ? user : null;

      setCurrentTutor(tutor);
      setProfile((currentProfile) => ({
        ...currentProfile,
        displayName: currentProfile.displayName || tutor?.name || '',
      }));
    });

    return () => unsubscribe();
  }, []);

  function updateProfileField<Field extends keyof TutorProfileDraft>(
    field: Field,
    value: TutorProfileDraft[Field]
  ) {
    /** Keep field changes tiny and predictable. */
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
  }

  async function finishTutorOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!currentTutor) {
      setError('Please log in again before saving your tutor profile.');
      return;
    }

    if (!profile.displayName.trim() || !profile.headline.trim() || !profile.subjects.trim()) {
      setError('Please add your display name, tutor headline, and subjects.');
      return;
    }

    setIsSaving(true);

    try {
      /** Save public tutor profile first so discovery has real Firebase data. */
      await saveTutorProfileFromOnboarding(currentTutor, profile);

      /** Mark the account as onboarded so future logins can go to dashboard. */
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
        description="Add the first details for your public tutor profile. Students will discover profiles from Firebase."
      />

      <Container className="max-w-3xl py-10">
        <Card>
          <form onSubmit={finishTutorOnboarding} className="grid gap-5">
            <div>
              <label className="text-sm font-medium text-slate-800" htmlFor="displayName">
                Display name
              </label>
              <input
                id="displayName"
                value={profile.displayName}
                onChange={(event) => updateProfileField('displayName', event.target.value)}
                placeholder="e.g. Maya Patel"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-800" htmlFor="headline">
                Tutor headline
              </label>
              <input
                id="headline"
                value={profile.headline}
                onChange={(event) => updateProfileField('headline', event.target.value)}
                placeholder="e.g. A-level Maths tutor focused on exam confidence"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-800" htmlFor="subjects">
                Subjects you teach
              </label>
              <textarea
                id="subjects"
                value={profile.subjects}
                onChange={(event) => updateProfileField('subjects', event.target.value)}
                placeholder="e.g. GCSE Maths, A-level Physics, TMUA"
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Separate subjects with commas for now. We can replace this with a
                full multi-select tutor onboarding step later.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-800" htmlFor="levels">
                  Levels taught
                </label>
                <input
                  id="levels"
                  value={profile.levels}
                  onChange={(event) => updateProfileField('levels', event.target.value)}
                  placeholder="e.g. GCSE, A-level"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-800" htmlFor="pricePerHour">
                  Hourly rate (£)
                </label>
                <input
                  id="pricePerHour"
                  type="number"
                  min={0}
                  max={100}
                  value={profile.pricePerHour}
                  onChange={(event) => updateProfileField('pricePerHour', Number(event.target.value))}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-800" htmlFor="university">
                  University
                </label>
                <input
                  id="university"
                  value={profile.university}
                  onChange={(event) => updateProfileField('university', event.target.value)}
                  placeholder="e.g. Imperial College London"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-800" htmlFor="degree">
                  Degree
                </label>
                <input
                  id="degree"
                  value={profile.degree}
                  onChange={(event) => updateProfileField('degree', event.target.value)}
                  placeholder="e.g. Mathematics BSc"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-800" htmlFor="learningStyles">
                Teaching styles
              </label>
              <input
                id="learningStyles"
                value={profile.learningStyles}
                onChange={(event) => updateProfileField('learningStyles', event.target.value)}
                placeholder="e.g. Visual explanations, Past-paper drilling"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {error && (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Finish setup'}
              </Button>
            </div>
          </form>
        </Card>
      </Container>
    </main>
  );
}
