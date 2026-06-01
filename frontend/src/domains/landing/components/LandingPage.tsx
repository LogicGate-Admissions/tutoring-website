import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { ROUTES } from '@/shared/constants/routes';

/**
 * Landing page for the public website.
 */
export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-slate-950">
      <Header />
      <HeroSection />
      <ProblemSection />
      <RoleSection />
    </main>
  );
}

function Header() {
  return (
    <header className="border-b border-slate-200/70 bg-[#f8f7f4]/80 backdrop-blur">
      <Container className="flex h-20 items-center justify-between">
        <p className="text-lg font-semibold tracking-tight">Tutorly</p>

        <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          <a href="#problem" className="hover:text-slate-950">
            Problem
          </a>
          <a href="#roles" className="hover:text-slate-950">
            Students & tutors
          </a>
        </nav>

        <Button href={ROUTES.studentOnboardingSubjects} variant="secondary">
          Get started
        </Button>
      </Container>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="py-20 lg:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Badge>For exam-preppers and tutors</Badge>

          <h1 className="mt-8 max-w-4xl text-5xl font-semibold leading-tight tracking-[-0.04em] text-slate-950 md:text-7xl">
            Better tutoring starts before the session.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Tutorly helps students find tutors who match how they learn, then
            gives both sides a clearer way to prepare, share context, and
            communicate asynchronously.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button href={ROUTES.studentOnboardingSubjects}>
              Continue as student
            </Button>
            <Button href={ROUTES.tutorDashboard} variant="secondary">
              Continue as tutor
            </Button>
          </div>
        </div>

        <HeroPreviewCard />
      </Container>
    </section>
  );
}

function HeroPreviewCard() {
  return (
    <Card className="bg-white/80 p-4">
      <div className="rounded-2xl bg-slate-950 p-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-300">Trial preparation</p>
          <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-medium text-slate-950">
            Awaiting reply
          </span>
        </div>

        <h2 className="mt-8 text-2xl font-semibold">
          “Can we go over integration by parts before Friday?”
        </h2>

        <p className="mt-4 text-sm leading-6 text-slate-300">
          Students can share what they are stuck on before a session, and tutors
          can reply with resources or next steps when they are available.
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium">Matched learning style</p>
          <p className="mt-1 text-sm text-slate-500">
            Past-paper drilling · A-Level Maths
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium">Tutor response</p>
          <p className="mt-1 text-sm text-slate-500">
            Added 2 worked examples and a short checklist.
          </p>
        </div>
      </div>
    </Card>
  );
}

function ProblemSection() {
  return (
    <section id="problem" className="py-16">
      <Container>
        <div className="max-w-3xl">
          <Badge>The problem</Badge>

          <h2 className="mt-6 text-3xl font-semibold tracking-tight md:text-5xl">
            Students need the right support, not just more support.
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            When resources and questions are scattered, students arrive with
            unclear needs, tutors spend time gathering context, and sessions
            become less useful than they could be.
          </p>
        </div>
      </Container>
    </section>
  );
}

function RoleSection() {
  return (
    <section id="roles" className="py-16">
      <Container>
        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <Badge>Students</Badge>
            <h3 className="mt-6 text-2xl font-semibold">
              Find support that fits how you learn.
            </h3>
            <p className="mt-4 leading-7 text-slate-600">
              Students build a learning profile, browse tutors by fit, and send
              useful context before asking for help.
            </p>
          </Card>

          <Card>
            <Badge>Tutors</Badge>
            <h3 className="mt-6 text-2xl font-semibold">
              Understand the student before the session starts.
            </h3>
            <p className="mt-4 leading-7 text-slate-600">
              Tutors review trial requests and respond with decisions or next
              steps without needing everything to happen live.
            </p>
          </Card>
        </div>
      </Container>
    </section>
  );
}
