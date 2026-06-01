import type { Day, QualificationCategory, TimeBlock } from '@/domains/students/learning-profile/types/learningProfile';

export const QUALIFICATION_CATEGORIES: QualificationCategory[] = [
  'A-level',
  'GCSE',
  'University admissions',
  'IB',
  'IGCSE',
  'IAL',
  'Scottish Highers',
];

export const SUBJECT_OPTIONS_BY_CATEGORY: Record<QualificationCategory, string[]> = {
  'A-level': [
    'Maths',
    'Physics',
    'Chemistry',
    'Biology',
    'Further Maths',
    'Computer Science',
    'Economics',
    'English Literature',
  ],
  GCSE: [
    'Maths',
    'English',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Combined Science',
  ],
  'University admissions': [
    'TMUA',
    'MAT',
    'STEP',
    'ESAT',
    'UCAT',
    'LNAT',
    'ENGAA',
    'TSA',
    'Interview preparation',
    'Personal statement',
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
    'Business',
  ],
  IAL: [
    'Maths',
    'Physics',
    'Chemistry',
    'Biology',
    'Further Maths',
    'Economics',
  ],
  'Scottish Highers': [
    'Maths',
    'Physics',
    'Chemistry',
    'Biology',
    'Computing Science',
    'English',
  ],
};

export const LEARNING_STYLE_OPTIONS = [
  {
    label: 'Visual explanations',
    description: 'Diagrams, sketches, colour coding, and visual worked examples.',
  },
  {
    label: 'Past-paper drilling',
    description: 'Exam-style questions, mark schemes, and timed repeated practice.',
  },
  {
    label: 'Step-by-step examples',
    description: 'Slow walkthroughs where each method is broken into clear steps.',
  },
  {
    label: 'Socratic questioning',
    description: 'The tutor guides thinking through questions instead of giving answers immediately.',
  },
  {
    label: 'Timed practice',
    description: 'Short timed tasks that build speed and confidence under exam conditions.',
  },
  {
    label: 'Interactive coding',
    description: 'Learning by building, debugging, and improving code together.',
  },
  {
    label: 'Essay planning',
    description: 'Structuring arguments, plans, paragraphs, and exam responses clearly.',
  },
];

export const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function presetBlock(id: string, day: Day, from: string, to: string): TimeBlock {
  return { id: `${id}-${day}-${from}-${to}`, day, from, to, source: 'preset' };
}

export const AVAILABILITY_PRESETS = [
  {
    id: 'weekday-mornings',
    label: 'Weekday mornings',
    description: 'Mon–Fri, 08:00–12:00',
    blocks: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) =>
      presetBlock('weekday-mornings', day as Day, '08:00', '12:00')
    ),
  },
  {
    id: 'after-school',
    label: 'After school',
    description: 'Mon–Fri, 16:00–18:00',
    blocks: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) =>
      presetBlock('after-school', day as Day, '16:00', '18:00')
    ),
  },
  {
    id: 'weekday-evenings',
    label: 'Weekday evenings',
    description: 'Mon–Fri, 18:00–21:00',
    blocks: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) =>
      presetBlock('weekday-evenings', day as Day, '18:00', '21:00')
    ),
  },
  {
    id: 'weekend-mornings',
    label: 'Weekend mornings',
    description: 'Sat–Sun, 09:00–12:00',
    blocks: ['Sat', 'Sun'].map((day) =>
      presetBlock('weekend-mornings', day as Day, '09:00', '12:00')
    ),
  },
  {
    id: 'weekend-evenings',
    label: 'Weekend evenings',
    description: 'Sat–Sun, 18:00–22:00',
    blocks: ['Sat', 'Sun'].map((day) =>
      presetBlock('weekend-evenings', day as Day, '18:00', '22:00')
    ),
  },
];

export const DEFAULT_LEARNING_PROFILE = {
  subjectSelections: [],
  learningStyles: [],
  availability: [],
} satisfies import('@/domains/students/learning-profile/types/learningProfile').StudentLearningProfile;

/**
 * Subjects shown before the user clicks "More subjects".
 *
 * These are the common STEM subjects students are most likely to look for
 * first. The full list is still available afterwards.
 */
export const PRIMARY_SUBJECTS_BY_CATEGORY: Record<
  QualificationCategory,
  string[]
> = {
  'A-level': [
    'Maths',
    'Further Maths',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
  ],
  GCSE: [
    'Maths',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Combined Science',
  ],
  'University admissions': [
    'TMUA',
    'MAT',
    'STEP',
    'ESAT',
    'UCAT',
    'Interview preparation',
  ],
  IB: [
    'Maths AA HL',
    'Maths AI HL',
    'Physics HL',
    'Chemistry HL',
    'Biology HL',
    'Computer Science HL',
  ],
  IGCSE: [
    'Maths',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
  ],
  IAL: [
    'Maths',
    'Further Maths',
    'Physics',
    'Chemistry',
    'Biology',
  ],
  'Scottish Highers': [
    'Maths',
    'Physics',
    'Chemistry',
    'Biology',
    'Computing Science',
  ],
};