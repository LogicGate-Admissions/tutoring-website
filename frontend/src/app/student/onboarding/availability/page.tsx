/**
 * File purpose: Student availability onboarding route.
 */

import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { StudentAvailabilityStep } from '@/domains/students/learning-profile/components/StudentAvailabilityStep';

/** URL: /student/onboarding/availability */
export default function StudentOnboardingAvailabilityPage() {
  return (
    <RequireAuth role="student">
      <StudentAvailabilityStep />
    </RequireAuth>
  );
}
