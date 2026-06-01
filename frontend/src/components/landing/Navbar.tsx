'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBrowseTutors = () => {
    setMenuOpen(false);
    const el = document.getElementById('tutor-explorer');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-6 transition-all duration-300 lg:px-12 ${
          scrolled
            ? 'bg-brand-primary shadow-[0_4px_0_rgba(0,0,0,0.15)]'
            : 'bg-brand-primary/90 backdrop-blur-md'
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-white/80 bg-brand-accent font-black text-sm text-slate-950 shadow-[2px_2px_0_rgba(255,255,255,0.3)] transition group-hover:shadow-[3px_3px_0_rgba(255,255,255,0.3)]">
            TM
          </div>
          <span className="font-serif text-lg font-bold text-white tracking-tight">
            TutorMatch
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <button
            type="button"
            onClick={handleBrowseTutors}
            className="text-sm font-semibold text-white/80 transition hover:text-white"
          >
            Browse Tutors
          </button>
          <Link
            href="/signup?role=tutor"
            className="text-sm font-semibold text-white/80 transition hover:text-white"
          >
            For Tutors
          </Link>
          <Link
            href="/signup?role=student"
            className="rounded-xl border-2 border-white bg-brand-accent px-5 py-2 text-sm font-bold text-slate-950 shadow-[3px_3px_0_rgba(255,255,255,0.4)] transition hover:brightness-105 hover:shadow-[4px_4px_0_rgba(255,255,255,0.4)] active:translate-x-px active:translate-y-px active:shadow-[2px_2px_0_rgba(255,255,255,0.4)]"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-white/40 md:hidden"
        >
          <span
            className={`block h-0.5 w-5 bg-white transition-all duration-200 ${menuOpen ? 'translate-y-2 rotate-45' : ''}`}
          />
          <span
            className={`block h-0.5 w-5 bg-white transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`}
          />
          <span
            className={`block h-0.5 w-5 bg-white transition-all duration-200 ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`}
          />
        </button>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-16 left-0 right-0 border-t-2 border-white/20 bg-brand-primary p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={handleBrowseTutors}
                className="rounded-xl border-2 border-white/30 px-5 py-3 text-left text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
              >
                Browse Tutors
              </button>
              <Link
                href="/signup?role=tutor"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border-2 border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
              >
                For Tutors
              </Link>
              <Link
                href="/signup?role=student"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border-2 border-white bg-brand-accent px-5 py-3 text-center text-sm font-bold text-slate-950 shadow-[3px_3px_0_rgba(255,255,255,0.4)]"
              >
                Get Started — It&apos;s Free
              </Link>
              <Link
                href="/onboarding"
                onClick={() => setMenuOpen(false)}
                className="text-center text-sm font-semibold text-white/60 transition hover:text-white/80"
              >
                Already have an account? Log in
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
