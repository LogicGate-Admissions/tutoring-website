/**
 * File purpose: Tutor onboarding route. Keep route files thin and delegate UI to domains/.
 */

import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { TutorOnboardingPage } from '@/domains/tutors/onboarding/components/TutorOnboardingPage';
import { AppTopNav } from '@/shared/components/AppTopNav';

/** URL: /tutor/onboarding */
export default function TutorOnboardingRoute() {
  return (
    <RequireAuth role="tutor">
      <AppTopNav userType="tutor" />
      <TutorOnboardingPage />
    </RequireAuth>
  );
}
