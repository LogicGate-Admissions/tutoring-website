/**
 * File purpose: Application source file. Comments explain what this file owns and what should stay elsewhere.
 */

import type { Day, TimeBlock } from '@/domains/students/learning-profile/types/learningProfile';

/**
 * Learning style and availability constants stay in code because they define
 * product interaction patterns, not editable academic content.
 *
 * The master subject list lives in academicOptionsService.
 */

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

/**
 * Universities students may prefer tutors to come from.
 *
 * This belongs in the learning profile because university preference is part
 * of the student's matching criteria, not just a temporary tutor search filter.
 */
export const UNIVERSITY_OPTIONS = [
  'Imperial College London',
  'University of Cambridge',
  'University of Oxford',
  'University College London',
  'King’s College London',
  'University of Warwick',
  'University of Manchester',
  'University of Bristol',
  'University of Edinburgh',
] as const;

export const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function presetBlock(id: string, day: Day, from: string, to: string): TimeBlock {
  return { id: `${id}-${day}-${from}-${to}`, day, from, to, source: 'preset' };
}

export const AVAILABILITY_PRESETS = [
  {
    id: 'weekday-mornings',
    label: 'Weekday mornings',
    description: 'Mon-Fri, 08:00-12:00',
    blocks: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) =>
      presetBlock('weekday-mornings', day as Day, '08:00', '12:00')
    ),
  },
  {
    id: 'after-school',
    label: 'After school',
    description: 'Mon-Fri, 16:00-18:00',
    blocks: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) =>
      presetBlock('after-school', day as Day, '16:00', '18:00')
    ),
  },
  {
    id: 'weekday-afternoons',
    label: 'Weekday afternoons',
    description: 'Mon-Fri, 13:00-17:00',
    blocks: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) =>
      presetBlock('weekday-afternoons', day as Day, '13:00', '17:00')
    ),
  },
  {
    id: 'weekday-evenings',
    label: 'Weekday evenings',
    description: 'Mon-Fri, 18:00-21:00',
    blocks: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) =>
      presetBlock('weekday-evenings', day as Day, '18:00', '21:00')
    ),
  },
  {
    id: 'weekend-mornings',
    label: 'Weekend mornings',
    description: 'Sat-Sun, 09:00-12:00',
    blocks: ['Sat', 'Sun'].map((day) =>
      presetBlock('weekend-mornings', day as Day, '09:00', '12:00')
    ),
  },
  {
    id: 'weekend-afternoons',
    label: 'Weekend afternoons',
    description: 'Sat-Sun, 13:00-17:00',
    blocks: ['Sat', 'Sun'].map((day) =>
      presetBlock('weekend-afternoons', day as Day, '13:00', '17:00')
    ),
  },
  {
    id: 'weekend-evenings',
    label: 'Weekend evenings',
    description: 'Sat-Sun, 18:00-22:00',
    blocks: ['Sat', 'Sun'].map((day) =>
      presetBlock('weekend-evenings', day as Day, '18:00', '22:00')
    ),
  },
];

export const DEFAULT_LEARNING_PROFILE = {
  studiedSubjectSelections: [],
  subjectSelections: [],
  learningStyles: [],
  preferredUniversities: [],
  availability: [],
} satisfies import('@/domains/students/learning-profile/types/learningProfile').StudentLearningProfile;

