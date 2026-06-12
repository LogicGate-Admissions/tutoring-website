/**
 * File purpose: Firestore service for public tutor profiles.
 *
 * React components should not talk to Firestore directly. They call this
 * service, and this file owns the database shape, defaults, and conversion from
 * onboarding drafts into the public Tutor model used by tutor discovery.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/shared/constants/firestoreCollections';
import type { AuthUser } from '@/domains/auth/types/auth';
import type {
  QualificationSubjectSelection,
  TimeBlock,
} from '@/domains/students/learning-profile/types/learningProfile';
import type {
  Tutor,
  TutorSubjectRate,
} from '@/domains/tutors/tutor-discovery/types/tutor';

/** Tutor onboarding draft edited by the tutor onboarding pages/tabs. */
export type TutorProfileDraft = {
  displayName: string;
  headline: string;
  subjectSelections: QualificationSubjectSelection[];
  subjectRates: TutorSubjectRate[];
  learningStyles: string[];
  university: string;
  degree: string;
  availability: TimeBlock[];
  bio: string;
};

/** Empty draft used by a new tutor before any Firestore profile exists. */
export const EMPTY_TUTOR_PROFILE_DRAFT: TutorProfileDraft = {
  displayName: '',
  headline: '',
  subjectSelections: [],
  subjectRates: [],
  learningStyles: [],
  university: '',
  degree: '',
  availability: [],
  bio: '',
};

/** Firestore document reference for one tutor profile keyed by auth uid. */
function tutorProfileDocumentRef(tutorId: string) {
  return doc(db, FIRESTORE_COLLECTIONS.tutorProfiles, tutorId);
}

/** Remove blank/duplicate values while preserving original order. */
function uniqueNonEmptyValues(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  );
}

/** Flatten structured qualification selections into public level labels. */
function levelsFromSubjectSelections(selections: QualificationSubjectSelection[]) {
  return selections
    .filter((selection) => selection.subjects.length > 0)
    .map((selection) => selection.category);
}

/** Flatten structured qualification selections into public subject labels. */
function subjectsFromSubjectSelections(selections: QualificationSubjectSelection[]) {
  return uniqueNonEmptyValues(
    selections.flatMap((selection) => selection.subjects)
  );
}

/** Return every selected qualification/subject pair from the structured draft. */
function selectedSubjectPairs(selections: QualificationSubjectSelection[]) {
  return selections.flatMap((selection) =>
    selection.subjects.map((subject) => ({
      qualification: selection.category,
      subject,
    }))
  );
}

/** Check whether two rate entries describe the same qualification + subject. */
function sameSubjectRatePair(
  first: Pick<TutorSubjectRate, 'qualification' | 'subject'>,
  second: Pick<TutorSubjectRate, 'qualification' | 'subject'>
) {
  return (
    first.qualification === second.qualification && first.subject === second.subject
  );
}

/** Clean Firestore subject rates so every selected subject has one numeric price. */
function normaliseSubjectRates(
  subjectSelections: QualificationSubjectSelection[],
  subjectRates: TutorSubjectRate[]
) {
  return selectedSubjectPairs(subjectSelections).map((pair) => {
    const existingRate = subjectRates.find((rate) =>
      sameSubjectRatePair(rate, pair)
    );

    return {
      ...pair,
      pricePerHour:
        existingRate && Number.isFinite(existingRate.pricePerHour)
          ? Math.max(existingRate.pricePerHour, 0)
          : 0,
    };
  });
}

/** Compute the cheapest visible rate for cards, filtering, and sorting. */
function minimumSubjectRate(subjectRates: TutorSubjectRate[]) {
  const numericRates = subjectRates
    .map((rate) => rate.pricePerHour)
    .filter((rate) => Number.isFinite(rate) && rate >= 0);

  if (numericRates.length === 0) return 0;

  return Math.min(...numericRates);
}

/** Create a readable availability summary for tutor cards and profile modals. */
function availabilitySummary(availability: TimeBlock[]) {
  if (availability.length === 0) {
    return 'Availability not added yet';
  }

  const firstBlocks = availability
    .slice(0, 4)
    .map((block) => `${block.day} ${block.from}-${block.to}`);

  const remainingCount = Math.max(availability.length - firstBlocks.length, 0);
  const suffix = remainingCount > 0 ? `, +${remainingCount} more` : '';

  return `${firstBlocks.join(', ')}${suffix}`;
}

/** Validate unknown Firestore subject rate data before using it in the UI. */
function mapSubjectRates(value: unknown): TutorSubjectRate[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    const rate = item as Partial<TutorSubjectRate>;

    if (
      !rate.qualification ||
      !rate.subject ||
      typeof rate.pricePerHour !== 'number'
    ) {
      return [];
    }

    return [{
      qualification: rate.qualification,
      subject: rate.subject,
      pricePerHour: rate.pricePerHour,
    }];
  });
}

/** Map unknown Firestore profile data into the Tutor model safely. */
function mapTutorDocument(snapshot: { id: string; data: () => unknown }): Tutor {
  const data = snapshot.data() as Partial<Tutor> & {
    availabilityBlocks?: TimeBlock[];
    subjectSelections?: QualificationSubjectSelection[];
    subjectRates?: unknown;
  };

  const availabilityBlocks = data.availabilityBlocks ?? [];
  const subjectRates = mapSubjectRates(data.subjectRates);

  return {
    id: snapshot.id,
    name: data.name ?? 'Unnamed tutor',
    headline: data.headline ?? 'Tutor profile',
    university: data.university ?? 'University not added yet',
    degree: data.degree ?? 'Degree not added yet',
    subjects: data.subjects ?? [],
    levels: data.levels ?? [],
    learningStyles: data.learningStyles ?? [],
    pricePerHour: data.pricePerHour ?? minimumSubjectRate(subjectRates),
    subjectRates,
    rating: data.rating ?? 0,
    reviews: data.reviews ?? 0,
    numberOfStudents: data.numberOfStudents ?? 0,
    availability: data.availability ?? availabilitySummary(availabilityBlocks),
    availabilityBlocks,
    bio: data.bio ?? 'This tutor has not added a full bio yet.',
    hobbies: data.hobbies ?? [],
    personality: data.personality ?? [],
    tags: data.tags ?? [],
  };
}

/** Convert a saved Tutor document back into an editable onboarding draft. */
function tutorToDraft(
  tutor: Tutor & { subjectSelections?: QualificationSubjectSelection[] }
) {
  return {
    ...EMPTY_TUTOR_PROFILE_DRAFT,
    displayName: tutor.name,
    headline: tutor.headline,
    subjectSelections: tutor.subjectSelections ?? [],
    subjectRates: tutor.subjectRates ?? [],
    learningStyles: tutor.learningStyles,
    university: tutor.university === 'University not added yet' ? '' : tutor.university,
    degree: tutor.degree === 'Degree not added yet' ? '' : tutor.degree,
    availability: tutor.availabilityBlocks ?? [],
    bio: tutor.bio === 'This tutor has not added a full bio yet.' ? '' : tutor.bio,
  } satisfies TutorProfileDraft;
}

/** Load a single tutor's public profile by their uid. */
export async function getTutorProfile(tutorId: string): Promise<Tutor | null> {
  const snapshot = await getDoc(tutorProfileDocumentRef(tutorId));
  if (!snapshot.exists()) return null;
  return mapTutorDocument(snapshot);
}

/** Load all public tutor profiles from Firestore for student discovery. */
export async function getTutorProfiles() {
  const tutorProfilesQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.tutorProfiles),
    orderBy('name')
  );

  const snapshot = await getDocs(tutorProfilesQuery);
  return snapshot.docs.map(mapTutorDocument);
}

/** Load the signed-in tutor's current profile for editing during onboarding. */
export async function getTutorProfileDraft(tutorId: string) {
  const snapshot = await getDoc(tutorProfileDocumentRef(tutorId));

  if (!snapshot.exists()) {
    return EMPTY_TUTOR_PROFILE_DRAFT;
  }

  const tutor = mapTutorDocument(snapshot) as Tutor & {
    subjectSelections?: QualificationSubjectSelection[];
  };

  const rawData = snapshot.data() as {
    subjectSelections?: QualificationSubjectSelection[];
  };

  return tutorToDraft({
    ...tutor,
    subjectSelections: rawData.subjectSelections ?? [],
  });
}

/** Create/update the signed-in tutor's public profile from onboarding. */
export async function saveTutorProfileFromOnboarding(
  tutor: AuthUser,
  profile: TutorProfileDraft
) {
  const profileRef = tutorProfileDocumentRef(tutor.id);
  const existingProfile = await getDoc(profileRef);
  const displayName = profile.displayName.trim() || tutor.name;
  const levels = levelsFromSubjectSelections(profile.subjectSelections);
  const subjects = subjectsFromSubjectSelections(profile.subjectSelections);
  const learningStyles = uniqueNonEmptyValues(profile.learningStyles);
  const subjectRates = normaliseSubjectRates(
    profile.subjectSelections,
    profile.subjectRates
  );
  const minimumPricePerHour = minimumSubjectRate(subjectRates);

  const profileDocument = {
    name: displayName,
    headline: profile.headline.trim() || 'Tutor profile',
    university: profile.university.trim() || 'University not added yet',
    degree: profile.degree.trim() || 'Degree not added yet',
    subjects,
    levels,
    subjectSelections: profile.subjectSelections,
    learningStyles,
    subjectRates,
    pricePerHour: minimumPricePerHour,
    minimumPricePerHour,
    rating: 0,
    reviews: 0,
    numberOfStudents: 0,
    availability: availabilitySummary(profile.availability),
    availabilityBlocks: profile.availability,
    bio: profile.bio.trim() || 'This tutor has not added a full bio yet.',
    hobbies: [],
    personality: [],
    tags: uniqueNonEmptyValues([...levels, ...subjects, ...learningStyles]),
    ownerId: tutor.id,
    updatedAt: serverTimestamp(),
    ...(existingProfile.exists() ? {} : { createdAt: serverTimestamp() }),
  };

  await setDoc(profileRef, profileDocument, { merge: true });
}
