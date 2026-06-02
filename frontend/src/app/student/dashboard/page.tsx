/**
 * File purpose: Student dashboard route.
 *
 * The student dashboard currently mirrors the tutor A/B navigation prototype.
 * It tests whether students expect async support to live under each tutor or
 * under action-first tabs such as messages, resources, and flagged questions.
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
          description="Testing the action-first navigation model for asynchronous support."
        />

        <StudentDashboard />
      </main>
    </RequireAuth>
  );
}
