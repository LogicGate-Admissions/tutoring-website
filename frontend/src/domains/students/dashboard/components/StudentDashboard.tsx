'use client';

/**
 * File purpose: Main student dashboard for ongoing tutor support.
 */

import { useEffect, useState } from 'react';
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

type Section = 'my-tutors' | 'learning-profile' | 'find-tutors' | 'my-sessions';

const tabs: Array<{ id: Section; label: string; description: string }> = [
  {
    id: 'my-tutors',
    label: 'My tutors',
    description: 'Tutor support',
  },
  {
    id: 'my-sessions',
    label: 'My sessions',
    description: 'Book & manage',
  },
  {
    id: 'learning-profile',
    label: 'Learning profile',
    description: 'Edit preferences',
  },
  {
    id: 'find-tutors',
    label: 'Find tutors',
    description: 'Browse matches',
  },
];

export function StudentDashboard() {
  const [activeSection, setActiveSection] = useState<Section>('my-tutors');
  const [currentUserId, setCurrentUserId] = useState('');
  const { relationships, isLoading, error } = useRelationshipSummaries('student');

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
          Manage support through each tutor
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Students start from a tutor relationship, then choose whether to
          message, view resources, or flag questions for that tutor.
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
              role="student"
              counterparties={relationships.map((r) => ({
                id: r.tutorId,
                name: r.tutorName,
              }))}
              getOtherPartyName={(b: BookingRequest) => {
                const rel = relationships.find((r) => r.tutorId === b.tutorId);
                return rel?.tutorName ?? 'Tutor';
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
  if (activeSection === 'learning-profile') {
    return (
      <ActionCard
        title="Learning profile"
        description="Edit the subjects, learning styles, universities, and availability used to match you with tutors."
        href={ROUTES.studentOnboardingSubjects}
        buttonLabel="Edit learning profile"
      />
    );
  }

  if (activeSection === 'find-tutors') {
    return (
      <ActionCard
        title="Find tutors"
        description="Browse tutors that match your learning profile and request a match."
        href={ROUTES.studentTutors}
        buttonLabel="Find tutors"
      />
    );
  }

  if (isLoading || error || relationships.length === 0) {
    return (
      <RelationshipListState
        isLoading={isLoading}
        error={error}
        isEmpty={relationships.length === 0}
        emptyTitle="No tutors yet"
        emptyDescription="When you become connected with a tutor, they will appear here with message, resource, and flagged-question actions."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {relationships.map((relationship) => (
        <SupportRelationshipCard
          key={relationship.id}
          relationship={relationship}
          viewerRole="student"
          currentUserId={currentUserId}
          actions={getStudentRelationshipActions(relationship.id)}
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

function getStudentRelationshipActions(relationshipId: string) {
  const baseHref = `/student/dashboard/support/${relationshipId}`;

  return [
    {
      label: 'Message',
      href: `${baseHref}/messages`,
    },
    {
      label: 'Resources',
      href: `${baseHref}/resources`,
    },
    {
      label: 'Flagged questions',
      href: `${baseHref}/questions`,
    },
  ];
}