/**
 * File purpose: Tutor dashboard route.
 *
 * The tutor dashboard helps tutors manage connected students and ongoing support.
 */

import { Suspense } from 'react';
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
          title="Dashboard"
        />

        <Suspense fallback={null}>
          <TutorDashboard />
        </Suspense>
      </main>
    </RequireAuth>
  );
}
