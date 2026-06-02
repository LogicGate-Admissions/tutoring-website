const steps = [
  {
    number: '1',
    title: 'Browse',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    description: 'Filter tutors by subject, budget, and availability. No account needed to explore the full directory.',
  },
  {
    number: '2',
    title: 'Connect',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    description: 'View full profiles, read real reviews from students, and message your chosen tutor directly.',
  },
  {
    number: '3',
    title: 'Learn',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
      </svg>
    ),
    description: 'Book a session, meet online or in person, and track your progress across subjects over time.',
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-surface-soft py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="text-center">
          <h2
            className="font-serif font-bold text-slate-950 text-wrap-balance"
            style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.025em' }}
          >
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base font-medium text-slate-500">
            From first browse to your first session in minutes.
          </p>
        </div>

        <div className="relative mt-16">
          {/* Connector line (desktop only) */}
          <div
            className="absolute top-12 left-[calc(16.66%+1.75rem)] right-[calc(16.66%+1.75rem)] hidden h-0.5 bg-slate-200 lg:block"
            aria-hidden="true"
          />

          <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center text-center lg:items-center">
                {/* Step circle */}
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-950 bg-brand-primary text-white shadow-[4px_4px_0_#0f172a]">
                  {step.icon}
                </div>

                {/* Decorative large number */}
                <div
                  className="pointer-events-none select-none font-serif font-bold leading-none text-slate-500"
                  style={{ fontSize: '6rem', marginTop: '-0.4rem', lineHeight: '1' }}
                  aria-hidden="true"
                >
                  {step.number}
                </div>

                <div style={{ marginTop: '-0.8em' }}>
                  <h3 className="text-xl font-bold text-slate-950">{step.title}</h3>
                  <p className="mx-auto mt-3 max-w-xs text-sm font-medium leading-6 text-slate-600 lg:max-w-none">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
