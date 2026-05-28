export type LearningStyle = {
  label: string;
  value: string;
  description: string;
};

export type University = {
  label: string;
  value: string;
};

export const learningStyles: LearningStyle[] = [
  {
    label: 'Visual explanations',
    value: 'visual',
    description: 'Diagrams, sketches and visual worked examples rather than mostly text.',
  },
  {
    label: 'Past-paper drilling',
    value: 'past-paper',
    description: 'Practice with exam-style questions, mark schemes and repeated timed problems.',
  },
  {
    label: 'Step-by-step examples',
    value: 'step-by-step',
    description: 'Tutor breaks the method down slowly so each step is clear before moving on.',
  },
  {
    label: 'Socratic questioning',
    value: 'socratic',
    description:
      'Tutor guides you with questions so you actively work through the problem instead of being told the answer immediately.',
  },
];

export const universities: University[] = [
  { label: 'Imperial College London', value: 'imperial-college-london' },
  { label: 'University of Cambridge', value: 'university-of-cambridge' },
  { label: 'University College London', value: 'university-college-london' },
  { label: 'King’s College London', value: 'kings-college-london' },
  { label: 'University of Oxford', value: 'university-of-oxford' },
  { label: 'University of Warwick', value: 'university-of-warwick' },
  { label: 'University of Manchester', value: 'university-of-manchester' },
  { label: 'University of Bristol', value: 'university-of-bristol' },
  { label: 'University of Edinburgh', value: 'university-of-edinburgh' },
  { label: 'London School of Economics', value: 'london-school-of-economics' },
];