/**
 * File purpose: Tutor trial session requests route.
 */

import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { TutorTrialSessionsPage } from '@/domains/sessions/trial-sessions/components/TutorTrialSessionsPage';

/** URL: /tutor/trial-sessions */
export default function TutorTrialSessionsRoute() {
  return (
    <RequireAuth role="tutor">
      <TutorTrialSessionsPage />
    </RequireAuth>
  );
}
