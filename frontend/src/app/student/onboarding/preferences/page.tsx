/**
 * File purpose: Student preferences onboarding route.
 */

import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { StudentPreferencesStep } from '@/domains/students/learning-profile/components/StudentPreferencesStep';
import { AppTopNav } from '@/shared/components/AppTopNav';

/** URL: /student/onboarding/preferences */
export default function StudentOnboardingPreferencesPage() {
  return (
    <RequireAuth role="student">
      <AppTopNav userType="student" />
      <StudentPreferencesStep />
    </RequireAuth>
  );
}
