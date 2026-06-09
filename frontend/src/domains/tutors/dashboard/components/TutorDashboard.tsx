'use client';

/**
 * File purpose: Main tutor dashboard for ongoing student support.
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RelationshipListState } from '@/domains/async-support/components/RelationshipListState';
import { SupportRelationshipCard } from '@/domains/async-support/components/SupportRelationshipCard';
import { useRelationshipSummaries } from '@/domains/async-support/hooks/useRelationshipSummaries';
import type { RelationshipSupportSummary } from '@/domains/async-support/types/asyncSupport';
import { subscribeToCurrentUser } from '@/domains/auth/services/authService';
import { MySessionsTab } from '@/domains/booking/components/sessions/MySessionsTab';
import type { BookingRequest } from '@/domains/booking/types/booking';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';

type Section = 'my-students' | 'tutor-profile' | 'trial-requests' | 'my-sessions';


const tabs: Array<{ id: Section; label: string; description: string }> = [
  {
    id: 'my-students',
    label: 'My students',
    description: 'Student support',
  },
  {
    id: 'my-sessions',
    label: 'My sessions',
    description: 'Book & manage',
  },
  {
    id: 'tutor-profile',
    label: 'Tutor profile',
    description: 'Edit your profile',
  },
  {
    id: 'trial-requests',
    label: 'Match requests',
    description: 'Review requests',
  },
];

const TUTOR_SECTIONS: Section[] = [
  'my-students',
  'my-sessions',
  'tutor-profile',
  'trial-requests',
];

function activeSectionFromParams(searchParams: ReturnType<typeof useSearchParams>): Section {
  const section = searchParams.get('section');
  if (section && TUTOR_SECTIONS.includes(section as Section)) {
    return section as Section;
  }
  return 'my-students';
}

export function TutorDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = activeSectionFromParams(searchParams);
  const [currentUserId, setCurrentUserId] = useState('');
  const { relationships, isLoading, error } = useRelationshipSummaries('tutor');

  function setActiveSection(section: Section) {
    router.replace(`/tutor/dashboard?section=${section}`, { scroll: false });
  }

  useEffect(() => {
    const unsub = subscribeToCurrentUser((user) => {
      setCurrentUserId(user?.id ?? '');
    });
    return unsub;
  }, []);

  return (
    <Container className="grid gap-6 py-8">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Support dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Manage support through each student
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Tutors start from a student relationship, then choose whether to
          message, share resources, manage sessions, or open the live workspace for that
          student.
        </p>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <SideTabs
          tabs={tabs}
          activeTab={activeSection}
          onChange={setActiveSection}
        />

        <main className="min-w-0">
          {activeSection === 'my-sessions' ? (
            <MySessionsTab
              userId={currentUserId}
              role="tutor"
              counterparties={relationships.map((r) => ({
                id: r.studentId,
                name: r.studentName,
              }))}
              getOtherPartyName={(b: BookingRequest) => {
                const rel = relationships.find((r) => r.studentId === b.studentId);
                return rel?.studentName ?? 'Student';
              }}
            />
          ) : (
            <RelationshipContent
              activeSection={activeSection}
              relationships={relationships}
              isLoading={isLoading}
              error={error}
              currentUserId={currentUserId}
            />
          )}
        </main>
      </div>
    </Container>
  );
}

function RelationshipContent({
  activeSection,
  relationships,
  isLoading,
  error,
  currentUserId,
}: {
  activeSection: Section;
  relationships: RelationshipSupportSummary[];
  isLoading: boolean;
  error: string | null;
  currentUserId: string;
}) {
  if (activeSection === 'tutor-profile') {
    return (
      <ActionCard
        title="Tutor profile"
        description="Edit the subjects, degree, university, pricing, learning styles and availability shown to students."
        href={ROUTES.tutorOnboarding}
        buttonLabel="Edit tutor profile"
      />
    );
  }

  if (activeSection === 'trial-requests') {
    return (
      <ActionCard
        title="Match requests"
        description="Review students who have requested a match with you."
        href={ROUTES.tutorTrialSessions}
        buttonLabel="View match requests"
      />
    );
  }

  if (isLoading || error || relationships.length === 0) {
    return (
      <RelationshipListState
        isLoading={isLoading}
        error={error}
        isEmpty={relationships.length === 0}
        emptyTitle="No students yet"
        emptyDescription="When a student becomes connected with you, they will appear here with message, resource, session, and workspace actions."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {relationships.map((relationship) => (
        <SupportRelationshipCard
          key={relationship.id}
          relationship={relationship}
          viewerRole="tutor"
          currentUserId={currentUserId}
          actions={getTutorRelationshipActions(relationship.id)}
        />
      ))}
    </div>
  );
}

function SideTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: Array<{ id: T; label: string; description: string }>;
  activeTab: T;
  onChange: (tab: T) => void;
}) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'rounded-2xl px-4 py-3 text-left transition',
              activeTab === tab.id
                ? 'bg-slate-950 text-white'
                : 'text-slate-700 hover:bg-slate-50'
            )}
          >
            <span className="block text-sm font-semibold">{tab.label}</span>
            <span
              className={cn(
                'mt-1 block text-xs leading-5',
                activeTab === tab.id ? 'text-slate-300' : 'text-slate-500'
              )}
            >
              {tab.description}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function ActionCard({
  title,
  description,
  href,
  buttonLabel,
}: {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
}) {
  return (
    <Card className="grid gap-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div>
        <Button href={href}>{buttonLabel}</Button>
      </div>
    </Card>
  );
}

function getTutorRelationshipActions(relationshipId: string) {
  const baseHref = `/tutor/dashboard/support/${relationshipId}`;

  return [
    {
      label: 'Message',
      href: `${baseHref}/messages`,
    },
    {
      label: 'Shared resources',
      href: `${baseHref}/resources`,
    },
    {
      label: 'Workspace',
      href: `${baseHref}/workspace`,
    },
  ];
}