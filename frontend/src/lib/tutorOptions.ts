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
  },
];

export const subjectFilters = [
  'All',
  'Maths',
  'Physics',
  'Biology',
  'Chemistry',
  'Computer Science',
];

export const learningStyleFilters = [
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