/**
 * File purpose: Student subjects onboarding route.
 */

import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { StudentSubjectsStep } from '@/domains/students/learning-profile/components/StudentSubjectsStep';
import { AppTopNav } from '@/shared/components/AppTopNav';

/** URL: /student/onboarding/subjects */
export default function StudentOnboardingSubjectsPage() {
  return (
    <RequireAuth role="student">
      <AppTopNav userType="student" />
      <StudentSubjectsStep />
    </RequireAuth>
  );
}
