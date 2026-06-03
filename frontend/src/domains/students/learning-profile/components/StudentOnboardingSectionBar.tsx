'use client';

/**
 * File purpose: Top tab navigation and guided controls for student onboarding.
 *
 * The visual style mirrors tutor onboarding: tabs sit at the top of the page,
 * while Back / Next / Finish controls sit below the active step content.
 */

import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/Button';
import { Container } from '@/shared/components/Container';
import { ROUTES } from '@/shared/constants/routes';
import {
  getCurrentFirebaseUser,
  markOnboardingComplete,
} from '@/domains/auth/services/authService';
import { cn } from '@/shared/utils/cn';

type OnboardingStep = 'subjects' | 'preferences' | 'availability';

type StudentOnboardingNavigationProps = {
  /** Current onboarding section used to highlight the active tab. */
  currentStep: OnboardingStep;

  /** Save hook called before moving away from the current onboarding page. */
  onBeforeNavigate?: () => void;
};

type OnboardingTab = {
  id: OnboardingStep;
  label: string;
  description: string;
  href: string;
};

/** Student onboarding tabs. Keep this list aligned with the three route pages. */
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
];

const STEP_ORDER: OnboardingStep[] = ['subjects', 'preferences', 'availability'];

function getStepIndex(step: OnboardingStep) {
  return STEP_ORDER.indexOf(step);
}

function getPreviousStep(step: OnboardingStep) {
  return STEP_ORDER[getStepIndex(step) - 1] ?? null;
}

function getNextStep(step: OnboardingStep) {
  return STEP_ORDER[getStepIndex(step) + 1] ?? null;
}

function hrefForStep(step: OnboardingStep) {
  if (step === 'subjects') return ROUTES.studentOnboardingSubjects;
  if (step === 'preferences') return ROUTES.studentOnboardingPreferences;
  return ROUTES.studentOnboardingAvailability;
}

/** Save the current step, mark onboarding complete, then send the student home. */
async function finishStudentOnboarding(onBeforeNavigate?: () => void) {
  onBeforeNavigate?.();

  const user = getCurrentFirebaseUser();

  if (user) {
    await markOnboardingComplete(user.uid);
  }
}

/** Top tab bar for direct student onboarding navigation. */
export function StudentOnboardingSectionBar({
  currentStep,
  onBeforeNavigate,
}: StudentOnboardingNavigationProps) {
  const router = useRouter();

  function navigateTo(href: string) {
    /** Save the current page before moving to another onboarding tab. */
    onBeforeNavigate?.();
    router.push(href);
  }

  return (
    <Container className="pt-10">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
        <div className="grid gap-2 md:grid-cols-3">
          {ONBOARDING_TABS.map((tab) => {
            const isActive = tab.id === currentStep;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigateTo(tab.href)}
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
      </div>
    </Container>
  );
}

/** Bottom controls for the guided Back / Next / Finish onboarding flow. */
export function StudentOnboardingFlowControls({
  currentStep,
  onBeforeNavigate,
}: StudentOnboardingNavigationProps) {
  const router = useRouter();
  const previousStep = getPreviousStep(currentStep);
  const nextStep = getNextStep(currentStep);
  const isFinalStep = !nextStep;

  function goBack() {
    if (!previousStep) return;

    onBeforeNavigate?.();
    router.push(hrefForStep(previousStep));
  }

  async function goForward() {
    if (nextStep) {
      onBeforeNavigate?.();
      router.push(hrefForStep(nextStep));
      return;
    }

    await finishStudentOnboarding(onBeforeNavigate);
    router.push(ROUTES.studentDashboard);
  }

  return (
    <Container className="pb-10">
      <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        {previousStep ? (
          <Button type="button" variant="secondary" onClick={goBack}>
            Back
          </Button>
        ) : (
          <span aria-hidden="true" />
        )}

        <Button type="button" onClick={() => void goForward()}>
          {isFinalStep ? 'Finish' : 'Next'}
        </Button>
      </div>
    </Container>
  );
}
