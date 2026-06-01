import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { ROUTES } from '@/shared/constants/routes';

/**
 * URL: /tutor/dashboard
 *
 * Small dashboard placeholder for the current tutor system.
 */
export default function TutorDashboardPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <PageHeader
        eyebrow="Tutor area"
        title="Tutor dashboard"
        description="A simple starting point for tutor-side workflows."
      />

      <Container className="py-10">
        <Card>
          <h2 className="text-xl font-semibold">Trial session requests</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Review student requests and respond when you are available.
          </p>
          <Button href={ROUTES.tutorTrialSessions} className="mt-6">
            View requests
          </Button>
        </Card>
      </Container>
    </main>
  );
}
