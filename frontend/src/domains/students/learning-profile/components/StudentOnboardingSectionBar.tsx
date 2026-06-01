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
 * Sticky navigation for onboarding sections.
 *
 * Important behaviour: all sections stay navigable even if the current step
 * is incomplete, so students can move freely between sections.
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
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
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
      </Container>
    </div>
  );
}
