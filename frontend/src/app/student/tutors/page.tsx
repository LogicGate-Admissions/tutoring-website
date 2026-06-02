/**
 * File purpose: Next.js route entry file. Keep this thin and delegate product logic to domains/.
 */

import { TutorDiscoveryPage } from '@/domains/tutors/tutor-discovery/components/TutorDiscoveryPage';

/**
 * URL: /student/tutors
 */
export default function StudentTutorsPage() {
  return <TutorDiscoveryPage />;
}
