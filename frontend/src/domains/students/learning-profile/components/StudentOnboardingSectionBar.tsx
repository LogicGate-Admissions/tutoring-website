'use client';

/**
 * Bottom onboarding tab bar.
 *
 * This component appears on each onboarding page and gives the student
 * a consistent way to move between the onboarding sections.
 *
 * We are intentionally keeping this simple for now:
 * - no Back button
 * - no Next button
 * - just direct navigation tabs
 *
 * The "Find tutors" tab should always be visible so the student can leave
 * onboarding and browse tutor matches whenever they are ready.
 */

import { useRouter } from 'next/navigation';
import { Container } from '@/shared/components/Container';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';

type OnboardingStep = 'subjects' | 'preferences' | 'availability';

type StudentOnboardingSectionBarProps = {
  /**
   * The current onboarding page.
   *
   * This is only used to highlight the active tab.
   */
  currentStep: OnboardingStep;

  /**
   * Called before navigation.
   *
   * Each onboarding page passes a save function here so that if the student
   * changes subjects, preferences, or availability, those changes are saved
   * before they move to another onboarding page or Find tutors.
   */
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

  function navigateTo(href: string) {
    /**
     * Save the current onboarding page before moving away.
     *
     * This prevents the student from losing changes if they click one of the
     * bottom tabs immediately after editing the page.
     */
    onBeforeNavigate?.();

    /**
     * Move to the selected onboarding section or tutor discovery page.
     */
    router.push(href);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 py-3 backdrop-blur">
      <Container>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ONBOARDING_TABS.map((tab) => {
              /**
               * Find tutors is never the active onboarding step because it is
               * outside the onboarding flow. Subjects, Preferences, and
               * Availability can be active.
               */
              const isActive = tab.id === currentStep;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => navigateTo(tab.href)}
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