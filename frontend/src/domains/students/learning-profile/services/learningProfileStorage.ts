import { DEFAULT_LEARNING_PROFILE } from '@/domains/students/learning-profile/constants/learningProfileOptions';
import type {
  QualificationCategory,
  QualificationSubjectSelection,
  StudentLearningProfile,
} from '@/domains/students/learning-profile/types/learningProfile';

const STORAGE_KEY = 'tutorly.studentLearningProfile';

type LegacyStoredLearningProfile = Partial<StudentLearningProfile> & {
  /**
   * Old single-qualification field.
   */
  category?: QualificationCategory | '';

  /**
   * Old multi-qualification field from the temporary version.
   */
  categories?: QualificationCategory[];

  /**
   * Old flat subject field.
   */
  subjects?: string[];
};

function migrateLegacySubjectSelections(
  parsedProfile: LegacyStoredLearningProfile
): QualificationSubjectSelection[] {
  if (parsedProfile.subjectSelections) {
    return parsedProfile.subjectSelections;
  }

  /**
   * Handles the older version:
   *
   * category: 'GCSE'
   * subjects: ['Maths', 'Physics']
   */
  if (parsedProfile.category && parsedProfile.subjects) {
    return [
      {
        category: parsedProfile.category,
        subjects: parsedProfile.subjects,
      },
    ];
  }

  /**
   * Handles the temporary multi-qualification version:
   *
   * categories: ['GCSE', 'A-level']
   * subjects: ['Maths', 'Physics']
   *
   * This cannot know which subject belonged to which qualification, so it
   * copies the old flat subjects into each selected qualification. From now on,
   * the new UI will save them correctly per qualification.
   */
  if (parsedProfile.categories && parsedProfile.subjects) {
    return parsedProfile.categories.map((category) => ({
      category,
      subjects: parsedProfile.subjects ?? [],
    }));
  }

  return [];
}

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
    const parsedProfile = JSON.parse(
      storedProfile
    ) as LegacyStoredLearningProfile;

    return {
      ...DEFAULT_LEARNING_PROFILE,
      ...parsedProfile,
      subjectSelections: migrateLegacySubjectSelections(parsedProfile),
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