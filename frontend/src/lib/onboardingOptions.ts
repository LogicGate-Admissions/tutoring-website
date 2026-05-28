export type Category = 'A-level' | 'GCSE' | 'University admissions' | 'Other';

export type Option = {
  label: string;
  value: string;
};

export const categories: Category[] = [
  'A-level',
  'GCSE',
  'University admissions',
  'Other',
];

export const otherQualifications: Option[] = [
  { label: 'IB', value: 'IB' },
  { label: 'IGCSE', value: 'IGCSE' },
  { label: 'IAL', value: 'IAL' },
  { label: 'Scottish Highers', value: 'Scottish Highers' },
];

export const subjectOptions: Record<string, Option[]> = {
  'A-level': [
    { label: 'Maths', value: 'Maths' },
    { label: 'Physics', value: 'Physics' },
    { label: 'Chemistry', value: 'Chemistry' },
    { label: 'Biology', value: 'Biology' },
    { label: 'Further Maths', value: 'Further Maths' },
    { label: 'Computer Science', value: 'Computer Science' },
  ],

  GCSE: [
    { label: 'Maths', value: 'Maths' },
    { label: 'English', value: 'English' },
    { label: 'Physics', value: 'Physics' },
    { label: 'Chemistry', value: 'Chemistry' },
    { label: 'Biology', value: 'Biology' },
    { label: 'Computer Science', value: 'Computer Science' },
  ],

  IB: [
    { label: 'Maths AA HL', value: 'Maths AA HL' },
    { label: 'Physics HL', value: 'Physics HL' },
    { label: 'Chemistry HL', value: 'Chemistry HL' },
    { label: 'Biology HL', value: 'Biology HL' },
    { label: 'Economics HL', value: 'Economics HL' },
    { label: 'Computer Sci HL', value: 'Computer Sci HL' },
  ],

  IGCSE: [
    { label: 'Maths', value: 'Maths' },
    { label: 'English', value: 'English' },
    { label: 'Physics', value: 'Physics' },
    { label: 'Chemistry', value: 'Chemistry' },
    { label: 'Biology', value: 'Biology' },
    { label: 'Computer Science', value: 'Computer Science' },
  ],

  IAL: [
    { label: 'Maths', value: 'Maths' },
    { label: 'Physics', value: 'Physics' },
    { label: 'Chemistry', value: 'Chemistry' },
    { label: 'Biology', value: 'Biology' },
    { label: 'Further Maths', value: 'Further Maths' },
  ],

  'Scottish Highers': [
    { label: 'Maths', value: 'Maths' },
    { label: 'Physics', value: 'Physics' },
    { label: 'Chemistry', value: 'Chemistry' },
    { label: 'Biology', value: 'Biology' },
    { label: 'Computing Science', value: 'Computing Science' },
  ],
};

export const admissionsTests: Option[] = [
  { label: 'TMUA', value: 'TMUA' },
  { label: 'MAT', value: 'MAT' },
  { label: 'STEP', value: 'STEP' },
  { label: 'ESAT', value: 'ESAT' },
  { label: 'UCAT', value: 'UCAT' },
  { label: 'LNAT', value: 'LNAT' },
  { label: 'ENGAA', value: 'ENGAA' },
  { label: 'TSA', value: 'TSA' },
];