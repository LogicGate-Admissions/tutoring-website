/**
 * File purpose: Student public profile onboarding route.
 */

import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { StudentProfileStep } from '@/domains/students/learning-profile/components/StudentProfileStep';
import { AppTopNav } from '@/shared/components/AppTopNav';

/** URL: /student/onboarding/profile */
export default function StudentOnboardingProfilePage() {
  return (
    <RequireAuth role="student">
      <AppTopNav userType="student" />
      <StudentProfileStep />
    </RequireAuth>
  );
}
