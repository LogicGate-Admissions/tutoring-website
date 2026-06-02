/**
 * File purpose: Student availability onboarding route.
 */

import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { StudentAvailabilityStep } from '@/domains/students/learning-profile/components/StudentAvailabilityStep';
import { AppTopNav } from '@/shared/components/AppTopNav';

/** URL: /student/onboarding/availability */
export default function StudentOnboardingAvailabilityPage() {
  return (
    <RequireAuth role="student">
      <AppTopNav userType="student" />
      <StudentAvailabilityStep />
    </RequireAuth>
  );
}
