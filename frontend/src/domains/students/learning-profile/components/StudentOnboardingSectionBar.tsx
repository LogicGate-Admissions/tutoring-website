'use client';

import { useRouter } from 'next/navigation';
import { Container } from '@/shared/components/Container';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';

type OnboardingStep = 'subjects' | 'preferences' | 'availability';

type StudentOnboardingSectionBarProps = {
  currentStep: OnboardingStep;
  onBeforeNavigate?: () => void;
};

const ONBOARDING_SECTIONS: Array<{
  id: OnboardingStep;
  label: string;
  href: string;
}> = [
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
];

/**
 * Sticky navigation for student onboarding.
 *
 * This is the main way students move around onboarding.
 * It also gives them a direct route back to the landing page or forward
 * to tutor discovery without forcing every onboarding section to be complete.
 */
export function StudentOnboardingSectionBar({
  currentStep,
  onBeforeNavigate,
}: StudentOnboardingSectionBarProps) {
  const router = useRouter();

  function navigateTo(href: string) {
    onBeforeNavigate?.();
    router.push(href);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 py-3 backdrop-blur">
      <Container>
        <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 md:grid-cols-[auto_1fr_auto]">
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.home)}
            className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            Landing page
          </button>

          <div className="grid grid-cols-3 gap-2">
            {ONBOARDING_SECTIONS.map((section) => {
              const isActive = section.id === currentStep;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => navigateTo(section.href)}
                  className={cn(
                    'rounded-xl px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-slate-950 text-white'
                      : 'bg-transparent text-slate-700 hover:bg-white'
                  )}
                >
                  {section.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => navigateTo(ROUTES.studentTutors)}
            className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Find tutors
          </button>
        </div>
      </Container>
    </div>
  );
}