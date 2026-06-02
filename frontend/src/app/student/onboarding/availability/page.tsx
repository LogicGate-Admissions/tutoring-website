/**
 * File purpose: Next.js route entry file. Keep this thin and delegate product logic to domains/.
 */

import { StudentAvailabilityStep } from '@/domains/students/learning-profile/components/StudentAvailabilityStep';

/**
 * URL: /student/onboarding/availability
 */
export default function StudentOnboardingAvailabilityPage() {
  return <StudentAvailabilityStep />;
}
