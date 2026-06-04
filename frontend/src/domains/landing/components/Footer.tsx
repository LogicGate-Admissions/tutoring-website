/**
 * File purpose: Landing-page component. It should reuse domain components rather than duplicating product logic.
 */

import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';

const links = {
  Platform: [
    { label: 'Browse Tutors', href: '/#tutor-explorer' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Student Profile', href: ROUTES.studentLogin },
  ],
  Students: [
    { label: 'Start onboarding', href: ROUTES.studentLogin },
    { label: 'Find tutors', href: ROUTES.studentTutors },
    { label: 'Student dashboard', href: ROUTES.studentLogin },
  ],
  Tutors: [
    { label: 'Tutor dashboard', href: ROUTES.tutorLogin },
    { label: 'Match requests', href: ROUTES.tutorTrialSessions },
    { label: 'For tutors', href: '/#for-tutors' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 pt-16 pb-8 text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-bold text-slate-950">
                LG
              </div>
              <span className="leading-tight">
                <span className="block text-sm font-bold text-white">LogicGate</span>
                <span className="block text-xs text-slate-400">Admissions</span>
              </span>
            </div>
            <p className="mt-4 max-w-[200px] text-sm leading-6 text-slate-400">
              Connecting students with expert tutors from the UK&apos;s top universities.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{section}</p>
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm font-medium text-slate-400 transition hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row">
          <p className="text-xs font-medium text-slate-500">
            &copy; 2025 LogicGate. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href={ROUTES.home} className="text-xs font-medium text-slate-500 transition hover:text-slate-300">Privacy Policy</Link>
            <Link href={ROUTES.home} className="text-xs font-medium text-slate-500 transition hover:text-slate-300">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
