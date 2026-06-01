import Link from 'next/link';

type StepTabsProps = {
  activeStep: 'subjects' | 'time' | 'preferences';
};

const steps = [
  { id: 'subjects', label: 'Subjects', href: '/onboarding' },
  { id: 'time', label: 'Time', href: '/time' },
  { id: 'preferences', label: 'Preferences', href: '/preferences' },
] as const;

export default function StepTabs({ activeStep }: StepTabsProps) {
  return (
    <nav className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 gap-3 rounded-2xl border-2 border-slate-950 bg-white px-4 py-3 shadow-[6px_6px_0_#0f172a]">
      {steps.map((step) => {
        const active = step.id === activeStep;

        return (
          <Link
            key={step.id}
            href={step.href}
            className={`rounded-xl border-2 border-slate-950 px-5 py-2 text-sm font-bold transition ${
              active
                ? 'bg-cyan-100 shadow-[3px_3px_0_#0f172a]'
                : 'bg-white hover:bg-slate-50'
            }`}
          >
            {step.label}
          </Link>
        );
      })}
    </nav>
  );
}