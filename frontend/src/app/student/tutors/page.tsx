/**
 * File purpose: Student tutor discovery route.
 */

import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { TutorDiscoveryPage } from '@/domains/tutors/tutor-discovery/components/TutorDiscoveryPage';
import { AppTopNav } from '@/shared/components/AppTopNav';

/** URL: /student/tutors */
export default function StudentTutorsPage() {
  return (
    <RequireAuth role="student">
      <AppTopNav userType="student" />
      <TutorDiscoveryPage />
    </RequireAuth>
  );
}
