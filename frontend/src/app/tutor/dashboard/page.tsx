/**
 * File purpose: Tutor dashboard route.
 *
 * The dashboard is intentionally empty for now. Tutor-side features can be
 * added here without changing the login/onboarding flow.
 */

import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { SignOutButton } from '@/domains/auth/components/SignOutButton';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';

/** URL: /tutor/dashboard */
export default function TutorDashboardPage() {
  return (
    <RequireAuth role="tutor">
      <main className="min-h-screen bg-[#f8f7f4]">
        <PageHeader
          eyebrow="Tutor area"
          title="Tutor dashboard"
          description="Dashboard features will be added here as the project develops."
        />

        <Container className="py-10">
          <Card className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-600">No dashboard widgets have been added yet.</p>
            <SignOutButton />
          </Card>
        </Container>
      </main>
    </RequireAuth>
  );
}
