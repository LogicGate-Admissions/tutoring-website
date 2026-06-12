/**
 * File purpose: Shared student learning-profile types used by onboarding,
 * tutor discovery, and profile persistence.
 */

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
 * The learning profile separates two ideas that students described as different:
 * what they study at school/college, and what they actually want tutoring for.
 *
 * `studiedSubjectSelections` is the broader academic context.
 * `subjectSelections` remains the tutoring need and is still used for tutor matching.
 */
export type StudentLearningProfile = {
  studiedSubjectSelections: QualificationSubjectSelection[];
  subjectSelections: QualificationSubjectSelection[];
  learningStyles: string[];
  preferredUniversities: string[];
  /** Short free-text note from the student about how they learn and what they need help with. */
  bio: string;
  availability: TimeBlock[];
};
