'use client';

/**
 * File purpose: Shared top navigation for authenticated student/tutor areas.
 *
 * The app pages need three always-available shortcuts:
 * - the logo returns to the public landing page
 * - Sign out clears the Firebase session
 * - the Dashboard button returns to the correct role dashboard
 */

import Link from 'next/link';
import { BrandHomeLink } from '@/shared/components/BrandHomeLink';
import { SignOutButton } from '@/domains/auth/components/SignOutButton';
import { NotificationBell } from '@/domains/notifications/components/NotificationBell';
import { Container } from '@/shared/components/Container';
import { ROUTES } from '@/shared/constants/routes';

type AppTopNavProps = {
  /** Determines whether the dashboard button points to student or tutor area. */
  userType: 'student' | 'tutor';
};

/** Shared header used by signed-in student and tutor pages. */
export function AppTopNav({ userType }: AppTopNavProps) {
  const dashboardHref =
    userType === 'student' ? ROUTES.studentDashboard : ROUTES.tutorDashboard;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <Container className="flex items-center justify-between py-4">
        <BrandHomeLink />

        <div className="flex items-center gap-3">
          <NotificationBell userType={userType} />

          <SignOutButton />

          <Link
            href={dashboardHref}
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 transition hover:border-slate-950 hover:bg-slate-50"
          >
            Dashboard
          </Link>
        </div>
      </Container>
    </header>
  );
}