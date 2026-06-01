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

export type QualificationSubjectSelection = {
  category: QualificationCategory;
  subjects: string[];
};

/**
 * The learning profile is the useful outcome of student onboarding.
 *
 * Subject selections are grouped by qualification because the same subject
 * can mean different things at different levels.
 *
 * Example:
 * GCSE Maths and A-level Maths should be treated as different choices.
 */
export type StudentLearningProfile = {
  subjectSelections: QualificationSubjectSelection[];
  learningStyles: string[];
  availability: TimeBlock[];
};