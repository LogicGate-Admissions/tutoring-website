'use client';

/**
 * File purpose: Bottom navigation for the student onboarding flow.
 *
 * The tab style now matches the cleaner tutor onboarding tabs, while the Back /
 * Next controls give students a guided route through the same pages.
 */

import { useRouter } from 'next/navigation';
import { Container } from '@/shared/components/Container';
import { ROUTES } from '@/shared/constants/routes';
import {
  getCurrentFirebaseUser,
  markOnboardingComplete,
} from '@/domains/auth/services/authService';
import { cn } from '@/shared/utils/cn';

type OnboardingStep = 'subjects' | 'preferences' | 'availability';

type StudentOnboardingSectionBarProps = {
  /** Current onboarding section used to highlight the active tab. */
  currentStep: OnboardingStep;

  /** Save hook called before moving away from the current onboarding page. */
  onBeforeNavigate?: () => void;
};

type OnboardingTab = {
  id: OnboardingStep | 'tutors';
  label: string;
  description: string;
  href: string;
};

const ONBOARDING_TABS: OnboardingTab[] = [
  {
    id: 'subjects',
    label: 'Subjects',
    description: 'What you study',
    href: ROUTES.studentOnboardingSubjects,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'How you learn',
    href: ROUTES.studentOnboardingPreferences,
  },
  {
    id: 'availability',
    label: 'Availability',
    description: 'When you are free',
    href: ROUTES.studentOnboardingAvailability,
  },
  {
    id: 'tutors',
    label: 'Tutors',
    description: 'Find matches',
    href: ROUTES.studentTutors,
  },
];

const STEP_ORDER: OnboardingStep[] = ['subjects', 'preferences', 'availability'];

function getStepIndex(step: OnboardingStep) {
  return STEP_ORDER.indexOf(step);
}

function getPreviousStep(step: OnboardingStep) {
  const previousStep = STEP_ORDER[getStepIndex(step) - 1];
  return previousStep ?? null;
}

function getNextStep(step: OnboardingStep) {
  const nextStep = STEP_ORDER[getStepIndex(step) + 1];
  return nextStep ?? null;
}

function hrefForStep(step: OnboardingStep) {
  if (step === 'subjects') return ROUTES.studentOnboardingSubjects;
  if (step === 'preferences') return ROUTES.studentOnboardingPreferences;
  return ROUTES.studentOnboardingAvailability;
}

export function StudentOnboardingSectionBar({
  currentStep,
  onBeforeNavigate,
}: StudentOnboardingSectionBarProps) {
  const router = useRouter();
  const previousStep = getPreviousStep(currentStep);
  const nextStep = getNextStep(currentStep);
  const isFinalStep = !nextStep;

  async function navigateTo(href: string) {
    /** Save the current page before leaving it. */
    onBeforeNavigate?.();

    /** Finishing onboarding lets later logins land on the student dashboard. */
    if (href === ROUTES.studentTutors) {
      const user = getCurrentFirebaseUser();

      if (user) {
        await markOnboardingComplete(user.uid);
      }
    }

    router.push(href);
  }

  function goBack() {
    if (!previousStep) return;
    void navigateTo(hrefForStep(previousStep));
  }

  function goForward() {
    if (nextStep) {
      void navigateTo(hrefForStep(nextStep));
      return;
    }

    void navigateTo(ROUTES.studentTutors);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 py-3 backdrop-blur">
      <Container>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-4">
            {ONBOARDING_TABS.map((tab) => {
              const isActive = tab.id === currentStep;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => void navigateTo(tab.href)}
                  className={cn(
                    'rounded-2xl px-4 py-3 text-left transition',
                    isActive
                      ? 'bg-slate-950 text-white'
                      : 'text-slate-700 hover:bg-white'
                  )}
                >
                  <span className="block text-sm font-semibold">{tab.label}</span>
                  <span
                    className={cn(
                      'mt-1 block text-xs leading-5',
                      isActive ? 'text-slate-300' : 'text-slate-500'
                    )}
                  >
                    {tab.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
            {previousStep ? (
              <button
                type="button"
                onClick={goBack}
                className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 transition hover:border-slate-950 hover:bg-slate-50"
              >
                Back
              </button>
            ) : (
              <span aria-hidden="true" />
            )}

            <button
              type="button"
              onClick={goForward}
              className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {isFinalStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}
