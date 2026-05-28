export type Category = 'A-level' | 'GCSE' | 'University admissions' | 'Other';

export const categories: Category[] = [
  'A-level',
  'GCSE',
  'University admissions',
  'Other',
];

export const otherQualifications = [
  'IB',
  'IGCSE',
  'IAL',
  'Scottish Highers',
];

export const subjectOptions: Record<string, string[]> = {
  'A-level': [
    'Maths',
    'Physics',
    'Chemistry',
    'Biology',
    'Further Maths',
    'Computer Science',
  ],

  GCSE: [
    'Maths',
    'English',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
  ],
};

export const moreSubjectOptions: Record<string, string[]> = {
  'A-level': [
    'English Literature',
    'English Language',
    'Economics',
    'Business',
    'Psychology',
    'Sociology',
    'History',
    'Geography',
    'Politics',
    'Philosophy',
    'French',
    'Spanish',
    'German',
    'Art',
    'Music',
  ],

  GCSE: [
    'English Literature',
    'English Language',
    'Combined Science',
    'Religious Studies',
    'History',
    'Geography',
    'French',
    'Spanish',
    'German',
    'Business',
    'Design Technology',
    'Art',
    'Music',
  ],

  'University admissions': [
    'STEP',
    'ESAT',
    'UCAT',
    'BMAT',
    'LNAT',
    'TSA',
    'ENGAA',
    'NSAA',
    'Interview preparation',
    'Personal statement',
  ],

  Other: [
    'IB Maths',
    'IB Physics',
    'IB Chemistry',
    'IB Biology',
    'IB Economics',
    'IB Computer Science',
    'IGCSE Maths',
    'IGCSE English',
    'IGCSE Physics',
    'IGCSE Chemistry',
    'IGCSE Biology',
    'IAL Maths',
    'IAL Physics',
    'IAL Chemistry',
    'IAL Biology',
    'Scottish Highers Maths',
    'Scottish Highers Physics',
    'Scottish Highers Chemistry',
    'Scottish Highers Biology',
    'Scottish Highers Computing Science',
  ],
};

export const admissionsTests = [
  'TMUA',
  'MAT',
  'STEP',
  'ESAT',
  'UCAT',
  'LNAT',
  'ENGAA',
  'TSA',
];