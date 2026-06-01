import { DEFAULT_LEARNING_PROFILE } from '@/domains/students/learning-profile/constants/learningProfileOptions';
import type { StudentLearningProfile } from '@/domains/students/learning-profile/types/learningProfile';

const STORAGE_KEY = 'tutorly.studentLearningProfile';

/**
 * Reads the profile from localStorage.
 *
 * localStorage is temporary client-side storage. It is good enough for the
 * current prototype and can later be replaced by Firestore user profiles.
 */
export function getStoredLearningProfile(): StudentLearningProfile {
  if (typeof window === 'undefined') {
    return DEFAULT_LEARNING_PROFILE;
  }

  const storedProfile = window.localStorage.getItem(STORAGE_KEY);

  if (!storedProfile) {
    return DEFAULT_LEARNING_PROFILE;
  }

  try {
    return {
      ...DEFAULT_LEARNING_PROFILE,
      ...JSON.parse(storedProfile),
    };
  } catch {
    return DEFAULT_LEARNING_PROFILE;
  }
}

export function saveLearningProfile(profile: StudentLearningProfile) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function updateStoredLearningProfile(
  update: Partial<StudentLearningProfile>
) {
  const nextProfile = {
    ...getStoredLearningProfile(),
    ...update,
  };

  saveLearningProfile(nextProfile);
  return nextProfile;
}
