/**
 * File purpose: Firestore persistence boundary for student learning profiles.
 *
 * Student onboarding components should not import Firebase directly. They call
 * these functions, and this file owns how the profile is loaded/saved. That
 * keeps the UI easy to read and makes future profile changes safer.
 */

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/shared/constants/firestoreCollections';
import { getCurrentFirebaseUser } from '@/domains/auth/services/authService';
import { DEFAULT_LEARNING_PROFILE } from '@/domains/students/learning-profile/constants/learningProfileOptions';
import type { StudentLearningProfile } from '@/domains/students/learning-profile/types/learningProfile';

/** Return the Firestore document reference for the signed-in student's profile. */
function studentProfileDocumentRef(studentId: string) {
  return doc(db, FIRESTORE_COLLECTIONS.studentProfiles, studentId);
}

/** Ensure callers do not silently save data without a Firebase user. */
function requireCurrentUserId() {
  const user = getCurrentFirebaseUser();

  if (!user) {
    throw new Error('You must be signed in before editing a learning profile.');
  }

  return user.uid;
}

/**
 * Load the current student's profile from Firestore.
 *
 * If no profile exists yet, return the default empty onboarding profile. This
 * lets brand new students start onboarding immediately after sign-up.
 */
export async function getStoredLearningProfile(): Promise<StudentLearningProfile> {
  const studentId = requireCurrentUserId();
  const snapshot = await getDoc(studentProfileDocumentRef(studentId));

  if (!snapshot.exists()) {
    return DEFAULT_LEARNING_PROFILE;
  }

  const storedProfile = snapshot.data() as Partial<StudentLearningProfile>;

  return {
    ...DEFAULT_LEARNING_PROFILE,
    ...storedProfile,
  };
}

/** Save the complete learning profile document for the current student. */
export async function saveLearningProfile(profile: StudentLearningProfile) {
  const studentId = requireCurrentUserId();

  await setDoc(
    studentProfileDocumentRef(studentId),
    {
      ...profile,
      ownerId: studentId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Update only part of the learning profile.
 *
 * Onboarding pages use partial updates so each step can save only the fields it
 * owns without accidentally wiping fields from other steps.
 */
export async function updateStoredLearningProfile(update: Partial<StudentLearningProfile>) {
  const currentProfile = await getStoredLearningProfile();
  const nextProfile = {
    ...currentProfile,
    ...update,
  };

  await saveLearningProfile(nextProfile);
  return nextProfile;
}
