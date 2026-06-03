/**
 * File purpose: Student dashboard route.
 *
 * The student dashboard helps students manage connected tutors and ongoing support.
 */

import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { StudentDashboard } from '@/domains/students/dashboard/components/StudentDashboard';
import { AppTopNav } from '@/shared/components/AppTopNav';
import { PageHeader } from '@/shared/components/PageHeader';

/** URL: /student/dashboard */
export default function StudentDashboardPage() {
  return (
    <RequireAuth role="student">
      <AppTopNav userType="student" />
      <main className="min-h-screen bg-[#f8f7f4]">
        <PageHeader
          eyebrow="Student area"
          title="Student dashboard"
          description="Manage connected tutoring relationships and asynchronous support."
        />

        <StudentDashboard />
      </main>
    </RequireAuth>
  );
}
