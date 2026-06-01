'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

function HeroCardMockup() {
  return (
    <div className="animate-float-card relative w-[300px] rounded-[1.75rem] border-2 border-slate-950 bg-white p-5 shadow-[8px_8px_0_#0f172a]">
      {/* Avatar + name row */}
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-950 bg-cyan-100 text-xl font-black shadow-[3px_3px_0_#0f172a]">
          MP
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-slate-950">Maya Patel</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">Imperial College London</p>
            </div>
            <div className="shrink-0 rounded-lg border-2 border-slate-950 bg-white px-2 py-1 text-xs font-bold">
              £32/hr
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {['Maths', 'Further Maths', 'TMUA'].map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Bio */}
      <p className="mt-3 line-clamp-2 text-xs font-medium leading-5 text-slate-600">
        I help students turn unclear topics into repeatable exam methods, especially for calculus and admissions prep.
      </p>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-black text-slate-950">★ 4.9</span>
        <span className="rounded-xl border-2 border-slate-950 bg-cyan-100 px-3 py-1 text-xs font-bold">
          View profile →
        </span>
      </div>
    </div>
  );
}

function FloatingBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`animate-float-badge rounded-xl border-2 border-slate-950 bg-white px-3 py-2 shadow-[4px_4px_0_#0f172a] ${className}`}
    >
      {children}
    </div>
  );
}

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBrowseTutors = () => {
    const el = document.getElementById('tutor-explorer');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-brand-primary pt-16">
      {/* Subtle dot grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center justify-center px-6 py-20 lg:flex-row lg:gap-16 lg:px-12">
        {/* Left: text */}
        <div className="flex-1 text-center lg:text-left">
          <div
            className={`${mounted ? 'animate-fade-slide-up' : 'opacity-0'}`}
            style={{ animationDelay: '0ms' }}
          >
            <h1
              className="font-serif font-bold leading-[1.1] text-white text-wrap-balance"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', letterSpacing: '-0.03em' }}
            >
              Find the right tutor.
              <br />
              <span className="text-brand-accent">Learn on your terms.</span>
            </h1>
          </div>

          <div
            className={`mt-6 ${mounted ? 'animate-fade-slide-up' : 'opacity-0'}`}
            style={{ animationDelay: '120ms' }}
          >
            <p className="mx-auto max-w-lg text-base font-medium leading-7 text-white/70 lg:mx-0 lg:text-lg">
              Browse verified tutors across every subject, filter by budget and teaching style, and book a session in minutes.
            </p>
          </div>

          <div
            className={`mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start ${mounted ? 'animate-fade-slide-up' : 'opacity-0'}`}
            style={{ animationDelay: '240ms' }}
          >
            <Link
              href="/signup?role=student"
              className="animate-pulse-glow rounded-xl border-2 border-white bg-brand-accent px-8 py-4 text-base font-bold text-slate-950 shadow-[4px_4px_0_white] transition hover:brightness-105 hover:shadow-[5px_5px_0_white] active:translate-x-px active:translate-y-px active:shadow-[3px_3px_0_white]"
            >
              Get Started — It&apos;s Free
            </Link>
            <button
              type="button"
              onClick={handleBrowseTutors}
              className="flex items-center gap-2 rounded-xl border-2 border-white/40 px-8 py-4 text-base font-semibold text-white transition hover:border-white/70 hover:bg-white/10"
            >
              Browse Tutors
              <span className="text-brand-accent">↓</span>
            </button>
          </div>
        </div>

        {/* Right: floating card mockup */}
        <div
          className={`relative mt-16 flex items-center justify-center lg:mt-0 lg:flex-1 ${mounted ? 'animate-fade-slide-up' : 'opacity-0'}`}
          style={{ animationDelay: '180ms' }}
        >
          {/* Decorative large circle behind card */}
          <div className="absolute h-72 w-72 rounded-full border-2 border-white/10 bg-white/5 lg:h-96 lg:w-96" />
          <div className="absolute h-48 w-48 rounded-full border border-white/8 bg-white/3 lg:h-64 lg:w-64" />

          <HeroCardMockup />

          {/* Floating badges */}
          <FloatingBadge className="absolute -top-4 -right-4 lg:-right-8">
            <p className="text-xs font-black text-slate-950">★ 4.9</p>
            <p className="text-[10px] font-semibold text-slate-500">42 reviews</p>
          </FloatingBadge>

          <FloatingBadge className="absolute -bottom-4 -left-4 lg:-left-8">
            <p className="text-[10px] font-bold text-slate-500">Top subject</p>
            <p className="text-xs font-black text-slate-950">A-level Maths</p>
          </FloatingBadge>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/30 p-1">
          <div className="animate-scroll-dot h-2 w-1 rounded-full bg-white/60" />
        </div>
      </div>
    </section>
  );
}
