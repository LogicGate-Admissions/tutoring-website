import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { ROUTES } from '@/shared/constants/routes';

/**
 * URL: /student/dashboard
 *
 * Small dashboard placeholder for the current prototype.
 */
export default function StudentDashboardPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Student area"
        title="Student dashboard"
        description="A simple starting point for the student system."
      />

      <Container className="grid gap-5 py-10 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">Find a tutor</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Browse tutors by subject, level, learning style, and hourly rate.
          </p>
          <Button href={ROUTES.studentTutors} className="mt-6">
            Browse tutors
          </Button>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Update learning profile</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Revisit the onboarding flow to adjust subjects and preferences.
          </p>
          <Button href={ROUTES.studentOnboardingSubjects} variant="secondary" className="mt-6">
            Edit profile
          </Button>
        </Card>
      </Container>
    </main>
  );
}
