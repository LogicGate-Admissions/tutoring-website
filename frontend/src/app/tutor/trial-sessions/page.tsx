/**
 * File purpose: Tutor trial session requests route.
 */

import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { TutorTrialSessionsPage } from '@/domains/sessions/trial-sessions/components/TutorTrialSessionsPage';
import { AppTopNav } from '@/shared/components/AppTopNav';

/** URL: /tutor/trial-sessions */
export default function TutorTrialSessionsRoute() {
  return (
    <RequireAuth role="tutor">
      <AppTopNav userType="tutor" />
      <TutorTrialSessionsPage />
    </RequireAuth>
  );
}
