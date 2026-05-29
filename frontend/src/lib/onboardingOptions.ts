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

  IB: [
    'Maths AA HL',
    'Maths AI HL',
    'Physics HL',
    'Chemistry HL',
    'Biology HL',
    'Economics HL',
    'Computer Science HL',
  ],

  IGCSE: [
    'Maths',
    'English',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
  ],

  IAL: [
    'Maths',
    'Physics',
    'Chemistry',
    'Biology',
    'Further Maths',
  ],

  'Scottish Highers': [
    'Maths',
    'Physics',
    'Chemistry',
    'Biology',
    'Computing Science',
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

  IB: [
    'English Literature HL',
    'History HL',
    'Geography HL',
    'Psychology HL',
    'Business Management HL',
    'Global Politics HL',
    'French HL',
    'Spanish HL',
  ],

  IGCSE: [
    'English Literature',
    'English Language',
    'Combined Science',
    'History',
    'Geography',
    'Business',
    'Economics',
    'French',
    'Spanish',
    'German',
    'Art',
    'Music',
  ],

  IAL: [
    'Economics',
    'Business',
    'Psychology',
    'English Literature',
    'History',
    'Geography',
  ],

  'Scottish Highers': [
    'English',
    'History',
    'Geography',
    'Business Management',
    'Economics',
    'French',
    'Spanish',
    'Art and Design',
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