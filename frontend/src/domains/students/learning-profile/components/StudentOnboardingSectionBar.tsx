'use client';

/**
 * File purpose: Bottom onboarding tab bar for the student learning profile.
 *
 * Current UX decision:
 * - show direct tabs only
 * - no Back button
 * - no Next button
 * - always show Find tutors so students can leave onboarding when ready
 */

import { useRouter } from 'next/navigation';
import { Container } from '@/shared/components/Container';
import { ROUTES } from '@/shared/constants/routes';
import { getCurrentFirebaseUser, markOnboardingComplete } from '@/domains/auth/services/authService';
import { cn } from '@/shared/utils/cn';

type OnboardingStep = 'subjects' | 'preferences' | 'availability';

type StudentOnboardingSectionBarProps = {
  /** Current onboarding section used only to highlight the active tab. */
  currentStep: OnboardingStep;

  /** Save hook called before moving away from the current onboarding page. */
  onBeforeNavigate?: () => void;
};

type OnboardingTab = {
  id: OnboardingStep | 'find-tutors';
  label: string;
  href: string;
};

const ONBOARDING_TABS: OnboardingTab[] = [
  {
    id: 'subjects',
    label: 'Subjects',
    href: ROUTES.studentOnboardingSubjects,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    href: ROUTES.studentOnboardingPreferences,
  },
  {
    id: 'availability',
    label: 'Availability',
    href: ROUTES.studentOnboardingAvailability,
  },
  {
    id: 'find-tutors',
    label: 'Find tutors',
    href: ROUTES.studentTutors,
  },
];

export function StudentOnboardingSectionBar({
  currentStep,
  onBeforeNavigate,
}: StudentOnboardingSectionBarProps) {
  const router = useRouter();

  async function navigateTo(href: string) {
    /** Save draft onboarding changes before leaving the page. */
    onBeforeNavigate?.();

    /**
     * Treat moving from onboarding into tutor discovery as completing the first
     * student onboarding pass. Future logins can then land on the dashboard.
     */
    if (href === ROUTES.studentTutors) {
      const user = getCurrentFirebaseUser();

      if (user) {
        await markOnboardingComplete(user.uid);
      }
    }

    /** Route to the selected onboarding section or tutor discovery. */
    router.push(href);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 py-3 backdrop-blur">
      <Container>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ONBOARDING_TABS.map((tab) => {
              /** Find tutors is outside onboarding, so it is never active here. */
              const isActive = tab.id === currentStep;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => void navigateTo(tab.href)}
                  className={cn(
                    'rounded-xl px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-slate-950 text-white'
                      : 'bg-transparent text-slate-700 hover:bg-white'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
}
