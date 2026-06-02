/**
 * File purpose: Student dashboard route.
 *
 * The dashboard is intentionally light for now, but it now links into the real
 * student areas through left-side tabs so the student can quickly move to tutor
 * discovery or edit their onboarding profile.
 */

import Link from 'next/link';
import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { SignOutButton } from '@/domains/auth/components/SignOutButton';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { DashboardShell } from '@/shared/components/dashboard/DashboardShell';
import { PageHeader } from '@/shared/components/PageHeader';
import { ROUTES } from '@/shared/constants/routes';

/** URL: /student/dashboard */
export default function StudentDashboardPage() {
  return (
    <RequireAuth role="student">
      <main className="min-h-screen bg-[#f8f7f4]">
        <PageHeader
          eyebrow="Student area"
          title="Student dashboard"
          description="Use the left tabs to find tutors or update your learning profile."
        />

        <DashboardShell
          navItems={[
            {
              label: 'Dashboard',
              href: ROUTES.studentDashboard,
              active: true,
              description: 'Student overview',
            },
            {
              label: 'Find tutors',
              href: ROUTES.studentTutors,
              description: 'Browse tutor matches',
            },
            {
              label: 'Learning profile',
              href: ROUTES.studentOnboardingSubjects,
              description: 'Subjects, style, availability',
            },
          ]}
          action={<SignOutButton />}
        >
          <Card className="grid gap-5">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Welcome back
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Dashboard widgets will be added here. For now, the important
                student action is to browse Firebase tutor profiles.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={ROUTES.studentTutors}>
                <Button>Find tutors</Button>
              </Link>
              <Link href={ROUTES.studentOnboardingSubjects}>
                <Button variant="secondary">Edit learning profile</Button>
              </Link>
            </div>
          </Card>
        </DashboardShell>
      </main>
    </RequireAuth>
  );
}
