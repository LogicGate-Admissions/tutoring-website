/**
 * File purpose: Next.js route entry file. Keep this thin and delegate product logic to domains/.
 */

import { StudentPreferencesStep } from '@/domains/students/learning-profile/components/StudentPreferencesStep';

/**
 * URL: /student/onboarding/preferences
 */
export default function StudentOnboardingPreferencesPage() {
  return <StudentPreferencesStep />;
}
