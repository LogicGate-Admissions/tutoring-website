/**
 * File purpose: Tutor dashboard route.
 *
 * The tutor dashboard currently hosts a temporary A/B navigation prototype for
 * Week 3 user testing. The actual async-support features are not implemented
 * here yet; the dashboard only tests how tutors expect to reach them.
 */

import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { TutorDashboard } from '@/domains/tutors/dashboard/components/TutorDashboard';
import { AppTopNav } from '@/shared/components/AppTopNav';
import { PageHeader } from '@/shared/components/PageHeader';

/** URL: /tutor/dashboard */
export default function TutorDashboardPage() {
  return (
    <RequireAuth role="tutor">
      <AppTopNav userType="tutor" />
      <main className="min-h-screen bg-[#f8f7f4]">
        <PageHeader
          eyebrow="Tutor area"
          title="Tutor dashboard"
          description="Testing the action-first navigation model for asynchronous support."
        />

        <TutorDashboard />
      </main>
    </RequireAuth>
  );
}
