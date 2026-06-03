/**
 * File purpose: Backwards-compatible onboarding redirect.
 */

import { redirect } from 'next/navigation';
import { ROUTES } from '@/shared/constants/routes';

/** Old /onboarding URL now starts the student login/onboarding flow. */
export default function OnboardingRedirect() {
  redirect(ROUTES.studentLogin);
}
