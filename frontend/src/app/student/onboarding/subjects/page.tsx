/**
 * File purpose: Student subjects onboarding route.
 */

import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { StudentSubjectsStep } from '@/domains/students/learning-profile/components/StudentSubjectsStep';

/** URL: /student/onboarding/subjects */
export default function StudentOnboardingSubjectsPage() {
  return (
    <RequireAuth role="student">
      <StudentSubjectsStep />
    </RequireAuth>
  );
}
