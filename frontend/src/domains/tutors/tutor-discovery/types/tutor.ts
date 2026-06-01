/**
 * Tutor profile shown to students while browsing.
 */
export type Tutor = {
  id: string;
  name: string;
  headline: string;
  university: string;
  degree: string;
  subjects: string[];
  levels: string[];
  learningStyles: string[];
  pricePerHour: number;
  rating: number;
  reviews: number;
  numberOfStudents: number;
  availability: string;
  bio: string;
  hobbies: string[];
  personality: string[];
  tags: string[];
};

export type TutorSortOption =
  | 'Best match'
  | 'Highest rated'
  | 'Lowest price'
  | 'Highest price';

/**
 * Filters students can apply while browsing tutors.
 */
export type TutorFilters = {
  subjects: string[];
  level: string;
  learningStyle: string;
  university: string;
  minPricePerHour: number;
  maxPricePerHour: number;
  sortBy: TutorSortOption;
};
