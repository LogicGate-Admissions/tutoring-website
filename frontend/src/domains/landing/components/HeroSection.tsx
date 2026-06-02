'use client';

import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';

function HeroCardMockup() {
  return (
    <div className="animate-float-card w-[300px] rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-lg font-semibold text-slate-700">
          MP
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-950">Maya Patel</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">Imperial College London</p>
            </div>
            <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
              £32/hr
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {['Maths', 'Further Maths', 'TMUA'].map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600"
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
        I help students turn unclear topics into repeatable exam methods, especially for calculus and admissions prep.
      </p>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-950">★ 4.9 · 42 reviews</span>
        <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-medium text-white">
          View profile
        </span>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const handleBrowseTutors = () => {
    document.getElementById('tutor-explorer')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="min-h-screen bg-[#f8f7f4] pt-16 border-b border-slate-200">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center justify-center gap-16 px-6 py-20 lg:flex-row lg:px-8">
        {/* Left: text */}
        <div className="flex-1 text-center lg:text-left">
          <p
            className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 transition-opacity duration-500 opacity-100"
          >
            For students
          </p>

          <h1
            className="mt-4 max-w-2xl text-5xl font-semibold tracking-[-0.04em] text-slate-950 text-wrap-balance transition-all duration-500 lg:text-7xl opacity-100 translate-y-0"
          >
            Find the right tutor.
          </h1>

          <p
            className="mt-6 max-w-xl text-lg leading-8 text-slate-600 text-wrap-pretty transition-all delay-100 duration-500 opacity-100 translate-y-0"
          >
            Browse verified tutors across every subject, filter by budget and teaching style, and book a session in minutes.
          </p>

          <div
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start transition-all delay-200 duration-500 opacity-100 translate-y-0"
          >
            <Link
              href={ROUTES.studentOnboardingSubjects}
              className="rounded-full bg-slate-950 px-8 py-3.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Get Started — It&apos;s Free
            </Link>
            <button
              type="button"
              onClick={handleBrowseTutors}
              className="rounded-full border border-slate-300 bg-white px-8 py-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Browse Tutors
            </button>
          </div>
        </div>

        {/* Right: floating card mockup */}
        <div
          className="relative flex items-center justify-center lg:flex-1 transition-all delay-150 duration-500 opacity-100 translate-y-0"
        >
          <HeroCardMockup />

          {/* Floating badges */}
          <div className="animate-float-badge absolute -top-3 -right-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm lg:-right-6">
            <p className="text-xs font-semibold text-slate-950">★ 4.9</p>
            <p className="text-[10px] font-medium text-slate-500">42 reviews</p>
          </div>

          <div className="animate-float-badge absolute -bottom-3 -left-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm lg:-left-6" style={{ animationDelay: '0.5s' }}>
            <p className="text-[10px] font-medium text-slate-500">Top subject</p>
            <p className="text-xs font-semibold text-slate-950">A-level Maths</p>
          </div>
        </div>
      </div>
    </section>
  );
}
