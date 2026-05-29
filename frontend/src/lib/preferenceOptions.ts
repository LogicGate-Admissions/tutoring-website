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
  { label: 'University of Oxford', value: 'university-of-oxford' },
  { label: 'University College London', value: 'university-college-london' },
  { label: 'King’s College London', value: 'kings-college-london' },
  { label: 'London School of Economics', value: 'london-school-of-economics' },
  { label: 'University of Warwick', value: 'university-of-warwick' },
  { label: 'University of Manchester', value: 'university-of-manchester' },
  { label: 'University of Bristol', value: 'university-of-bristol' },
  { label: 'University of Edinburgh', value: 'university-of-edinburgh' },
  { label: 'University of Bath', value: 'university-of-bath' },
  { label: 'University of Birmingham', value: 'university-of-birmingham' },
  { label: 'University of Leeds', value: 'university-of-leeds' },
  { label: 'University of Nottingham', value: 'university-of-nottingham' },
  { label: 'University of Southampton', value: 'university-of-southampton' },
  { label: 'University of Glasgow', value: 'university-of-glasgow' },
  { label: 'Durham University', value: 'durham-university' },
  { label: 'University of York', value: 'university-of-york' },
  { label: 'Queen Mary University of London', value: 'queen-mary-university-of-london' },
  { label: 'Lancaster University', value: 'lancaster-university' },
  { label: 'Newcastle University', value: 'newcastle-university' },
  { label: 'University of Sheffield', value: 'university-of-sheffield' },
  { label: 'Cardiff University', value: 'cardiff-university' },
  { label: 'University of Exeter', value: 'university-of-exeter' },
];