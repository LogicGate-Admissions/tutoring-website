/**
 * File purpose: Next.js route entry file. Keep this thin and delegate product logic to domains/.
 */

import { redirect } from 'next/navigation';

export default function OnboardingRedirect() {
  redirect('/student/onboarding/subjects');
}
