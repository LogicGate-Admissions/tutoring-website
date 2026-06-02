/**
 * File purpose: Firestore service for public tutor profiles.
 *
 * This replaces the old hardcoded `TUTOR_PROFILES` array. Components now ask
 * this service for tutor profiles, which means real tutor sign-ups can create
 * real searchable profiles in Firebase without changing the discovery UI.
 */

import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/shared/constants/firestoreCollections';
import type { AuthUser } from '@/domains/auth/types/auth';
import type { Tutor } from '@/domains/tutors/tutor-discovery/types/tutor';

/** Draft fields collected during tutor onboarding. */
export type TutorProfileDraft = {
  displayName: string;
  headline: string;
  subjects: string;
  levels: string;
  learningStyles: string;
  university: string;
  degree: string;
  pricePerHour: number;
};

/** Convert a comma-separated text field into a clean array for filtering. */
function parseCommaSeparatedList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Firestore document reference for one tutor profile keyed by auth uid. */
function tutorProfileDocumentRef(tutorId: string) {
  return doc(db, FIRESTORE_COLLECTIONS.tutorProfiles, tutorId);
}

/** Map Firestore data into the Tutor type expected by discovery components. */
function mapTutorDocument(snapshot: { id: string; data: () => unknown }): Tutor {
  const data = snapshot.data() as Partial<Tutor>;

  return {
    id: snapshot.id,
    name: data.name ?? 'Unnamed tutor',
    headline: data.headline ?? 'Tutor profile',
    university: data.university ?? 'University not added yet',
    degree: data.degree ?? 'Degree not added yet',
    subjects: data.subjects ?? [],
    levels: data.levels ?? [],
    learningStyles: data.learningStyles ?? [],
    pricePerHour: data.pricePerHour ?? 25,
    rating: data.rating ?? 0,
    reviews: data.reviews ?? 0,
    numberOfStudents: data.numberOfStudents ?? 0,
    availability: data.availability ?? 'Availability not added yet',
    bio: data.bio ?? 'This tutor has not added a full bio yet.',
    hobbies: data.hobbies ?? [],
    personality: data.personality ?? [],
    tags: data.tags ?? [],
  };
}

/** Load all public tutor profiles from Firestore. */
export async function getTutorProfiles() {
  const tutorProfilesQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.tutorProfiles),
    orderBy('name')
  );

  const snapshot = await getDocs(tutorProfilesQuery);
  return snapshot.docs.map(mapTutorDocument);
}

/**
 * Create/update the signed-in tutor's public profile from onboarding.
 *
 * Early onboarding only asks for a few fields. The remaining fields get safe
 * defaults so tutor discovery can render the profile without special cases.
 */
export async function saveTutorProfileFromOnboarding(
  tutor: AuthUser,
  profile: TutorProfileDraft
) {
  const displayName = profile.displayName.trim() || tutor.name;
  const subjects = parseCommaSeparatedList(profile.subjects);
  const levels = parseCommaSeparatedList(profile.levels);
  const learningStyles = parseCommaSeparatedList(profile.learningStyles);

  await setDoc(
    tutorProfileDocumentRef(tutor.id),
    {
      name: displayName,
      headline: profile.headline.trim() || 'Tutor profile',
      university: profile.university.trim() || 'University not added yet',
      degree: profile.degree.trim() || 'Degree not added yet',
      subjects,
      levels,
      learningStyles,
      pricePerHour: profile.pricePerHour || 25,
      rating: 0,
      reviews: 0,
      numberOfStudents: 0,
      availability: 'Availability not added yet',
      bio: 'This tutor has not added a full bio yet.',
      hobbies: [],
      personality: [],
      tags: subjects,
      ownerId: tutor.id,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}
