'use client';

/**
 * File purpose: Landing-page component. It should reuse domain components rather than duplicating product logic.
 */

import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
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
    document.getElementById('tutor-explorer')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-16 border-b transition-all duration-200 ${
          scrolled
            ? 'border-slate-200 bg-white/95 backdrop-blur-sm'
            : 'border-transparent bg-[#f8f7f4]/95 backdrop-blur-sm'
        }`}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link href={ROUTES.home} className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-bold text-white">
              TM
            </div>
            <span className="text-base font-semibold tracking-[-0.02em] text-slate-950">
              LogicGate
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            <button
              type="button"
              onClick={handleBrowseTutors}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Browse Tutors
            </button>
            <Link
              href={ROUTES.tutorLogin}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              For Tutors
            </Link>
            <Link
              href={ROUTES.studentLogin}
              className="rounded-full bg-slate-950 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
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
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white md:hidden"
          >
            <span className={`block h-px w-4 bg-slate-950 transition-all duration-200 ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`block h-px w-4 bg-slate-950 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-px w-4 bg-slate-950 transition-all duration-200 ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-16 left-0 right-0 border-b border-slate-200 bg-white p-6 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleBrowseTutors}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Browse Tutors
              </button>
              <Link
                href={ROUTES.tutorLogin}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                For Tutors
              </Link>
              <Link
                href={ROUTES.studentLogin}
                onClick={() => setMenuOpen(false)}
                className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Get Started — It&apos;s Free
              </Link>
              <Link
                href={ROUTES.studentLogin}
                onClick={() => setMenuOpen(false)}
                className="text-center text-sm font-medium text-slate-500 transition hover:text-slate-950"
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
