/**
 * File purpose: Student tutor discovery route.
 */

import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { TutorDiscoveryPage } from '@/domains/tutors/tutor-discovery/components/TutorDiscoveryPage';

/** URL: /student/tutors */
export default function StudentTutorsPage() {
  return (
    <RequireAuth role="student">
      <TutorDiscoveryPage />
    </RequireAuth>
  );
}
