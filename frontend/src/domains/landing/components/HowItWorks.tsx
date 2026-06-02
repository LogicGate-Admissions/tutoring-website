/**
 * File purpose: Landing-page component. It should reuse domain components rather than duplicating product logic.
 */

const steps = [
  {
    number: '1',
    title: 'Browse',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    description: 'Filter tutors by subject, budget, and availability. No account needed to explore the full directory.',
  },
  {
    number: '2',
    title: 'Connect',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    description: 'View full profiles, read real reviews from students, and message your chosen tutor directly.',
  },
  {
    number: '3',
    title: 'Learn',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
      </svg>
    ),
    description: 'Book a session, meet online or in person, and track your progress across subjects over time.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-slate-200 bg-[#f8f7f4] py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 lg:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">
            From first browse to your first session in minutes.
          </p>
        </div>

        <div className="relative mt-16">
          {/* Connector line — desktop only */}
          <div
            className="absolute top-6 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] hidden h-px bg-slate-200 lg:block"
            aria-hidden="true"
          />

          <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center text-center">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm text-slate-950">
                  {step.icon}
                </div>

                <div
                  className="pointer-events-none select-none font-semibold leading-none text-slate-500"
                  style={{ fontSize: '6rem', marginTop: '-0.4rem', lineHeight: '1' }}
                  aria-hidden="true"
                >
                  {step.number}
                </div>

                <div style={{ marginTop: '-0.8em' }}>
                  <h3 className="text-lg font-semibold text-slate-950">{step.title}</h3>
                  <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-600 lg:max-w-none">
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
