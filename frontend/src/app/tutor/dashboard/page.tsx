/**
 * File purpose: Tutor dashboard route.
 *
 * The tutor dashboard starts simple but now has left-side tabs into the tutor
 * areas the team will build out next: trial requests and profile onboarding.
 */

import Link from 'next/link';
import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { SignOutButton } from '@/domains/auth/components/SignOutButton';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { DashboardShell } from '@/shared/components/dashboard/DashboardShell';
import { PageHeader } from '@/shared/components/PageHeader';
import { AppTopNav } from '@/shared/components/AppTopNav';
import { ROUTES } from '@/shared/constants/routes';

/** URL: /tutor/dashboard */
export default function TutorDashboardPage() {
  return (
    <RequireAuth role="tutor">
      <AppTopNav userType="tutor" />
      <main className="min-h-screen bg-[#f8f7f4]">
        <PageHeader
          eyebrow="Tutor area"
          title="Tutor dashboard"
          description="Use the left tabs to review student trial requests or update your tutor profile."
        />

        <DashboardShell
          navItems={[
            {
              label: 'Dashboard',
              href: ROUTES.tutorDashboard,
              active: true,
              description: 'Tutor overview',
            },
            {
              label: 'Trial requests',
              href: ROUTES.tutorTrialSessions,
              description: 'Student requirements and requests',
            },
            {
              label: 'Tutor profile',
              href: ROUTES.tutorOnboarding,
              description: 'Subjects, rates, availability',
            },
          ]}
          action={<SignOutButton />}
        >
          <Card className="grid gap-5">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Tutor workspace
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Dashboard widgets will be added here. For now, tutors can review
                incoming student trial requests and update their Firestore tutor
                profile.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={ROUTES.tutorTrialSessions}>
                <Button>View trial requests</Button>
              </Link>
              <Link href={ROUTES.tutorOnboarding}>
                <Button variant="secondary">Edit tutor profile</Button>
              </Link>
            </div>
          </Card>
        </DashboardShell>
      </main>
    </RequireAuth>
  );
}
