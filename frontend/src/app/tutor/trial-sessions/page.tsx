/**
 * File purpose: Legacy tutor pending-students route.
 *
 * Pending students now live inside the main tutor dashboard so the left-hand
 * navigation remains stable, matching My students and My sessions.
 */

import { redirect } from 'next/navigation';

/** URL: /tutor/trial-sessions */
export default function TutorTrialSessionsRoute() {
  redirect('/tutor/dashboard?section=pending-students');
}
