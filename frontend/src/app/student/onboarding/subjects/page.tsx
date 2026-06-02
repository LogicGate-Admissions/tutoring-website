/**
 * File purpose: Next.js route entry file. Keep this thin and delegate product logic to domains/.
 */

import { StudentSubjectsStep } from '@/domains/students/learning-profile/components/StudentSubjectsStep';

/**
 * URL: /student/onboarding/subjects
 */
export default function StudentOnboardingSubjectsPage() {
  return <StudentSubjectsStep />;
}
