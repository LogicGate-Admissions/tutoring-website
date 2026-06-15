'use client';

/**
 * File purpose: Final student onboarding step for public-facing profile details.
 */

import { useEffect, useState } from 'react';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { ProfilePhotoUploader } from '@/shared/components/ProfilePhotoUploader';
import { Card } from '@/shared/components/Card';
import {
  StudentOnboardingFlowControls,
  StudentOnboardingSectionBar,
} from '@/domains/students/learning-profile/components/StudentOnboardingSectionBar';
import {
  getStoredLearningProfile,
  updateStoredLearningProfile,
} from '@/domains/students/learning-profile/services/learningProfileStorage';
import { getCurrentFirebaseUser, subscribeToCurrentUser } from '@/domains/auth/services/authService';
import type { AuthUser } from '@/domains/auth/types/auth';

/** Student profile step shown after availability and before finishing onboarding. */
export function StudentProfileStep() {
  const [currentStudent, setCurrentStudent] = useState<AuthUser | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToCurrentUser((user) => {
      setCurrentStudent(user?.role === 'student' ? user : null);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const profile = await getStoredLearningProfile();

      if (!isMounted) return;

      const firebaseUser = getCurrentFirebaseUser();
      const fallbackName =
        firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || '';

      setDisplayName(profile.displayName || fallbackName);
      setBio(profile.bio);
      setPhotoUrl(profile.photoUrl ?? '');
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);


  function updateDisplayName(value: string) {
    if (error) setError(null);
    setDisplayName(value);
  }

  function updateBio(value: string) {
    if (error) setError(null);
    setBio(value);
  }

  function updatePhotoUrl(value: string) {
    if (error) setError(null);
    setPhotoUrl(value);
  }

  function saveDraftProfile() {
    void updateStoredLearningProfile({
      displayName: displayName.trim(),
      bio,
      photoUrl,
    });
  }

  async function validateBeforeFinish() {
    const trimmedDisplayName = displayName.trim();
    const trimmedBio = bio.trim();

    if (!trimmedDisplayName) {
      setError('Please add your display name.');
      return false;
    }

    if (!trimmedBio) {
      setError('Please add a short student bio.');
      return false;
    }

    await updateStoredLearningProfile({
      displayName: trimmedDisplayName,
      bio: trimmedBio,
      photoUrl,
    });

    setError(null);
    return true;
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Student onboarding"
        title="Set up your student profile"
        description="Add the name, face photo, and short note that tutors will see when you request support."
      />

      <StudentOnboardingSectionBar
        currentStep="profile"
        onBeforeNavigate={saveDraftProfile}
      />

      <Container className="py-8">
        <Card>
          <h2 className="text-xl font-semibold">Profile basics</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            These details help tutors recognise who they are supporting across requests,
            messages, sessions, and shared resources.
          </p>

          <div className="mt-5 grid gap-5">
            <ProfilePhotoUploader
              userId={currentStudent?.id}
              name={displayName || currentStudent?.name || 'Student'}
              photoUrl={photoUrl}
              helperText="This face photo appears in requests, dashboards, messages, and student profile previews."
              onUploaded={updatePhotoUrl}
            />

            <TextField
              id="student-display-name"
              label="Display name"
              value={displayName}
              placeholder="e.g. Leo Walter"
              onChange={updateDisplayName}
            />

            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="student-bio">
              Short bio
              <textarea
                id="student-bio"
                value={bio}
                rows={5}
                maxLength={700}
                placeholder="Example: I understand visual explanations best, but I struggle to know where to start on longer exam questions. I want a tutor who can break questions down step by step."
                onChange={(event) => updateBio(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <p className="-mt-3 text-xs text-slate-500">{bio.length}/700 characters</p>
          </div>
        </Card>

        {error ? (
          <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
      </Container>

      <StudentOnboardingFlowControls
        currentStep="profile"
        onBeforeNavigate={saveDraftProfile}
        onFinishGuard={validateBeforeFinish}
      />
    </main>
  );
}

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

function TextField({ id, label, value, placeholder, onChange }: TextFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor={id}>
      {label}
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}
