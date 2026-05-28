export type Tutor = {
  id: string;
  name: string;
  university: string;
  subjects: string[];
  levels: string[];
  learningStyles: string[];
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  bio: string;
  tags: string[];
  avatarColour: string;
};

export const tutors: Tutor[] = [
  {
    id: 'maya-patel',
    name: 'Maya Patel',
    university: 'Imperial College London',
    subjects: ['Maths', 'Further Maths', 'Physics'],
    levels: ['A-level', 'TMUA', 'MAT'],
    learningStyles: ['Visual explanations', 'Past-paper drilling'],
    hourlyRate: 32,
    rating: 4.9,
    reviewCount: 38,
    bio: 'Maths tutor focused on admissions preparation, visual explanations and building exam confidence through repeated practice.',
    tags: ['First Principles', 'Visual', 'TMUA'],
    avatarColour: 'bg-cyan-100',
  },
  {
    id: 'samuel-chen',
    name: 'Samuel Chen',
    university: 'University of Cambridge',
    subjects: ['Maths', 'Physics'],
    levels: ['A-level', 'STEP', 'MAT'],
    learningStyles: ['Socratic questioning', 'Step-by-step examples'],
    hourlyRate: 35,
    rating: 4.8,
    reviewCount: 29,
    bio: 'Helps students reason from first principles and work through difficult problems without just giving away the answer.',
    tags: ['Socratic', 'STEP', 'Problem Solving'],
    avatarColour: 'bg-purple-100',
  },
  {
    id: 'aisha-khan',
    name: 'Aisha Khan',
    university: 'University College London',
    subjects: ['Chemistry', 'Biology'],
    levels: ['A-level', 'GCSE'],
    learningStyles: ['Step-by-step examples', 'Past-paper drilling'],
    hourlyRate: 27,
    rating: 4.7,
    reviewCount: 41,
    bio: 'Patient science tutor who breaks down difficult topics into clear examples before moving into exam questions.',
    tags: ['Step-by-step', 'Past Papers', 'Science'],
    avatarColour: 'bg-green-100',
  },
  {
    id: 'daniel-wright',
    name: 'Daniel Wright',
    university: 'University of Warwick',
    subjects: ['Computer Science', 'Maths'],
    levels: ['A-level', 'GCSE'],
    learningStyles: ['Visual explanations', 'Step-by-step examples'],
    hourlyRate: 25,
    rating: 4.6,
    reviewCount: 22,
    bio: 'Computer science and maths tutor who uses diagrams, traces and worked examples to explain abstract ideas clearly.',
    tags: ['Visual', 'CS', 'Worked Examples'],
    avatarColour: 'bg-orange-100',
  },
  {
    id: 'elena-rossi',
    name: 'Elena Rossi',
    university: 'University of Oxford',
    subjects: ['Maths', 'Physics'],
    levels: ['IB', 'A-level', 'MAT'],
    learningStyles: ['Past-paper drilling', 'Socratic questioning'],
    hourlyRate: 36,
    rating: 5.0,
    reviewCount: 17,
    bio: 'Admissions-focused tutor for students preparing for maths-heavy applications and interview-style problem solving.',
    tags: ['MAT', 'Socratic', 'Admissions'],
    avatarColour: 'bg-pink-100',
  },
  {
    id: 'james-owen',
    name: 'James Owen',
    university: 'University of Manchester',
    subjects: ['Biology', 'Chemistry'],
    levels: ['GCSE', 'A-level'],
    learningStyles: ['Visual explanations', 'Step-by-step examples'],
    hourlyRate: 24,
    rating: 4.5,
    reviewCount: 33,
    bio: 'Friendly biology and chemistry tutor who helps students organise scattered revision into clear topic-by-topic progress.',
    tags: ['Visual', 'GCSE', 'Revision Plan'],
    avatarColour: 'bg-yellow-100',
  },
];

export const onboardingSubjectFilters = [
  'All',
  'Maths',
  'Physics',
  'Further Maths',
  'TMUA',
  'MAT',
];

export const allSubjectFilters = [
  'All',
  'Maths',
  'Further Maths',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'Economics',
  'TMUA',
  'MAT',
  'STEP',
  'ESAT',
  'UCAT',
  'LNAT',
];

export const onboardingLearningStyleFilters = [
  'Any Style',
  'Visual explanations',
  'Past-paper drilling',
];

export const allLearningStyleFilters = [
  'Any Style',
  'Visual explanations',
  'Past-paper drilling',
  'Step-by-step examples',
  'Socratic questioning',
];

export const universityFilters = [
  'Any University',
  'Imperial College London',
  'University of Cambridge',
  'University College London',
  'University of Oxford',
  'University of Warwick',
  'University of Manchester',
];

export const sortOptions = [
  'Top Rated',
  'Lowest Price',
  'Highest Price',
  'Most Reviews',
];

export const subjectColourClasses: Record<string, string> = {
  Maths: 'bg-blue-500',
  'Further Maths': 'bg-indigo-500',
  Physics: 'bg-cyan-500',
  Chemistry: 'bg-emerald-500',
  Biology: 'bg-green-500',
  'Computer Science': 'bg-purple-500',
  English: 'bg-orange-500',
  Economics: 'bg-yellow-500',
  TMUA: 'bg-pink-500',
  MAT: 'bg-rose-500',
  STEP: 'bg-red-500',
  ESAT: 'bg-teal-500',
  UCAT: 'bg-lime-500',
  LNAT: 'bg-amber-500',
};