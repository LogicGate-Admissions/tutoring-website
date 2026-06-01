export type QualificationCategory =
  | 'A-level'
  | 'GCSE'
  | 'University admissions'
  | 'IB'
  | 'IGCSE'
  | 'IAL'
  | 'Scottish Highers';

export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export type TimeBlock = {
  id: string;
  day: Day;
  from: string;
  to: string;
  source: 'preset' | 'manual';
};

/**
 * The learning profile is the useful outcome of student onboarding.
 *
 * It is separate from the UI so tutor discovery can reuse it later.
 */
export type StudentLearningProfile = {
  categories: QualificationCategory[];
  subjects: string[];
  learningStyles: string[];
  availability: TimeBlock[];
};