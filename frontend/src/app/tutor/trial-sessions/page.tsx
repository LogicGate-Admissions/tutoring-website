/**
 * File purpose: Next.js route entry file. Keep this thin and delegate product logic to domains/.
 */

import { TutorTrialSessionsPage } from '@/domains/sessions/trial-sessions/components/TutorTrialSessionsPage';

/**
 * URL: /tutor/trial-sessions
 */
export default function TutorTrialSessionsRoute() {
  return <TutorTrialSessionsPage />;
}
