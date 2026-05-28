import Link from 'next/link';

type Step = 'subjects' | 'time' | 'preferences';

type StepTabsProps = {
  activeStep?: Step;
};

const steps: { id: Step; label: string; href: string }[] = [
  { id: 'subjects', label: 'Subjects', href: '/' },
  { id: 'time', label: 'Time', href: '/time' },
  { id: 'preferences', label: 'Preferences', href: '/preferences' },
];

export default function StepTabs({ activeStep = 'subjects' }: StepTabsProps) {
  return (
    <nav className="fixed bottom-6 left-1/2 z-20 w-[min(720px,calc(100%-32px))] -translate-x-1/2 rounded-[2rem] border-2 border-slate-950 bg-white px-5 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
      <div className="grid grid-cols-3 gap-3 text-center text-sm font-semibold text-slate-950">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className={`rounded-full px-4 py-2 transition ${
              activeStep === step.id
                ? 'bg-cyan-100 ring-2 ring-slate-950'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {step.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}