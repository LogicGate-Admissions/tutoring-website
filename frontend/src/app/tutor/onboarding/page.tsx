/**
 * File purpose: Tutor onboarding route. Keep route files thin and delegate UI to domains/.
 */

import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { TutorOnboardingPage } from '@/domains/tutors/onboarding/components/TutorOnboardingPage';

/** URL: /tutor/onboarding */
export default function TutorOnboardingRoute() {
  return (
    <RequireAuth role="tutor">
      <TutorOnboardingPage />
    </RequireAuth>
  );
}
