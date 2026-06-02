/**
 * File purpose: Firestore service for shared academic option data.
 *
 * This service is the single read boundary for the master subject list.
 * Student onboarding, tutor onboarding, and tutor filters should call this
 * service rather than importing hardcoded subject arrays.
 *
 * Expected Firestore shape:
 *
 * academicSubjects/{documentId}
 *   category: "GCSE" | "A-level" | "University admissions" | ...
 *   subjects: ["Maths", "Physics", "TMUA", ...]
 *
 * Keeping this in Firestore means adding/removing subjects does not require a
 * code change. It also guarantees students and tutors choose from the same
 * source of truth.
 */

import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/shared/constants/firestoreCollections';
import type { QualificationCategory } from '@/domains/students/learning-profile/types/learningProfile';
import type {
  AcademicSubjectGroup,
  SubjectOptionsByCategory,
} from '@/domains/academic-options/types/academicOptions';

/** Qualification labels supported by the current product UI. */
export const QUALIFICATION_CATEGORIES: QualificationCategory[] = [
  'A-level',
  'GCSE',
  'University admissions',
  'IB',
  'IGCSE',
  'IAL',
  'Scottish Highers',
];

/** Check unknown Firestore data before trusting it as a qualification label. */
function isQualificationCategory(value: unknown): value is QualificationCategory {
  return (
    typeof value === 'string' &&
    QUALIFICATION_CATEGORIES.includes(value as QualificationCategory)
  );
}

/** Remove blank/duplicate subject names while preserving the editor's order. */
function normaliseSubjects(subjects: unknown) {
  if (!Array.isArray(subjects)) return [];

  return Array.from(
    new Set(
      subjects
        .filter((subject): subject is string => typeof subject === 'string')
        .map((subject) => subject.trim())
        .filter(Boolean)
    )
  );
}

/** Convert one Firestore document into a safe AcademicSubjectGroup. */
function mapAcademicSubjectDocument(snapshot: {
  id: string;
  data: () => unknown;
}): AcademicSubjectGroup | null {
  const data = snapshot.data() as {
    category?: unknown;
    subjects?: unknown;
  };

  if (!isQualificationCategory(data.category)) {
    return null;
  }

  return {
    id: snapshot.id,
    category: data.category,
    subjects: normaliseSubjects(data.subjects),
  };
}

/** Load the master subject list from Firestore. */
export async function getAcademicSubjectGroups() {
  const academicSubjectsQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.academicSubjects),
    orderBy('category')
  );

  const snapshot = await getDocs(academicSubjectsQuery);

  return snapshot.docs
    .map(mapAcademicSubjectDocument)
    .filter((group): group is AcademicSubjectGroup => group !== null);
}

/** Build a qualification -> subjects lookup for subject picker components. */
export async function getSubjectOptionsByCategory(): Promise<SubjectOptionsByCategory> {
  const groups = await getAcademicSubjectGroups();

  return groups.reduce<SubjectOptionsByCategory>((lookup, group) => {
    lookup[group.category] = group.subjects;
    return lookup;
  }, {});
}

/** Safely read the options for one qualification from a Firestore-backed lookup. */
export function getSubjectsForQualification(
  optionsByCategory: SubjectOptionsByCategory,
  category: QualificationCategory | ''
) {
  if (!category) return [];

  return optionsByCategory[category] ?? [];
}
