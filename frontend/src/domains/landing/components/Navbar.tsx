'use client';

/**
 * File purpose: Landing-page component. It should reuse domain components rather than duplicating product logic.
 */

import Link from 'next/link';
import { BrandHomeLink } from '@/shared/components/BrandHomeLink';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { ROUTES } from '@/shared/constants/routes';
import { useState } from 'react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="logicgate-landing-nav fixed top-0 left-0 right-0 z-50 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-sm transition-all duration-200">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <BrandHomeLink />

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href={ROUTES.studentLogin}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              For Students
            </Link>
            <Link
              href={ROUTES.tutorLogin}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              For Tutors
            </Link>
            <ThemeToggle />
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white"
            >
              <span className={`block h-px w-4 bg-slate-950 transition-all duration-200 ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
              <span className={`block h-px w-4 bg-slate-950 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-px w-4 bg-slate-950 transition-all duration-200 ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="logicgate-mobile-drawer absolute top-16 left-0 right-0 border-b border-slate-200 bg-white p-6 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-3">
              <Link
                href={ROUTES.studentLogin}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                For Students
              </Link>
              <Link
                href={ROUTES.tutorLogin}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                For Tutors
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
