'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/shared/constants/routes';
import { OnboardingShell } from '@/shared/components/OnboardingShell';

type OnboardingStep = 'subjects' | 'preferences' | 'availability';

type StudentOnboardingShellProps = {
  currentStep: OnboardingStep;
  children: ReactNode;
  onBeforeNavigate?: () => void;
  onFinish?: () => Promise<void>;
  isSaving?: boolean;
};

const ONBOARDING_TABS = [
  { id: 'subjects', label: 'Subjects', href: ROUTES.studentOnboardingSubjects },
  { id: 'preferences', label: 'Preferences', href: ROUTES.studentOnboardingPreferences },
  { id: 'availability', label: 'Availability', href: ROUTES.studentOnboardingAvailability },
];

export function StudentOnboardingShell({
  currentStep,
  children,
  onBeforeNavigate,
  onFinish,
  isSaving,
}: StudentOnboardingShellProps) {
  const router = useRouter();
  const isLastStep = currentStep === 'availability';

  function handleSelectTab(id: string) {
    const tab = ONBOARDING_TABS.find((t) => t.id === id as any);
    if (!tab) return;
    onBeforeNavigate?.();
    router.push(tab.href);
  }

  async function handleBottomAction() {
    onBeforeNavigate?.();

    if (isLastStep) {
      if (onFinish) {
        await onFinish();
        return;
      }

      router.push(ROUTES.studentTutors);
      return;
    }

    const currentIndex = ONBOARDING_TABS.findIndex((t) => t.id === currentStep);
    const next = ONBOARDING_TABS[currentIndex + 1];

    if (next) {
      router.push(next.href);
    }
  }

  return (
    <OnboardingShell
      tabs={ONBOARDING_TABS.map(({ id, label }) => ({ id, label }))}
      currentId={currentStep}
      onSelectTab={handleSelectTab}
      isLast={isLastStep}
      onBottomAction={handleBottomAction}
      isSaving={isSaving}
    >
      {children}
    </OnboardingShell>
  );
}
