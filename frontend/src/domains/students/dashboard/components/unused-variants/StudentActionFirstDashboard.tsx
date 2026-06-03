'use client';

/**
 * Version B: action-first student dashboard.
 *
 * This component is intentionally self-contained. If this variant wins, move
 * this file up one folder, rename it to StudentDashboard.tsx, rename the export
 * to StudentDashboard, and point /student/dashboard at it.
 */

import { useState } from 'react';
import { RelationshipListState } from '@/domains/async-support/components/RelationshipListState';
import { SupportRelationshipCard } from '@/domains/async-support/components/SupportRelationshipCard';
import { useRelationshipSummaries } from '@/domains/async-support/hooks/useRelationshipSummaries';
import type { RelationshipSupportSummary } from '@/domains/async-support/types/asyncSupport';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';

type Section =
  | 'messages'
  | 'resources'
  | 'flagged-questions'
  | 'learning-profile'
  | 'find-tutors';

const tabs: Array<{ id: Section; label: string; description: string }> = [
  {
    id: 'messages',
    label: 'Messages',
    description: 'Choose tutor',
  },
  {
    id: 'resources',
    label: 'Resources',
    description: 'Choose tutor',
  },
  {
    id: 'flagged-questions',
    label: 'Flagged questions',
    description: 'Choose tutor',
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

export function StudentActionFirstDashboard() {
  const [activeSection, setActiveSection] = useState<Section>('messages');
  const { relationships, isLoading, error } = useRelationshipSummaries('student');

  return (
    <Container className="grid gap-6 py-8">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Action-first prototype
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Manage support through actions
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Students start from the type of async support they want, then choose
          which tutor the action relates to.
        </p>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <SideTabs
          tabs={tabs}
          activeTab={activeSection}
          onChange={setActiveSection}
        />

        <main className="min-w-0">
          <InboxContent
            activeSection={activeSection}
            relationships={relationships}
            isLoading={isLoading}
            error={error}
          />
        </main>
      </div>
    </Container>
  );
}

function InboxContent({
  activeSection,
  relationships,
  isLoading,
  error,
}: {
  activeSection: Section;
  relationships: RelationshipSupportSummary[];
  isLoading: boolean;
  error: string | null;
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
        description="Browse tutors that match your learning profile and request a trial session."
        href={ROUTES.studentTutors}
        buttonLabel="Find tutors"
      />
    );
  }

  const copy = {
    messages: {
      title: 'Messages',
      description: 'Choose a tutor to open the message thread.',
      buttonLabel: 'Open messages',
    },
    resources: {
      title: 'Resources',
      description: 'Choose a tutor to open shared resources.',
      buttonLabel: 'Open resources',
    },
    'flagged-questions': {
      title: 'Flagged questions',
      description: 'Choose a tutor to review your flagged questions.',
      buttonLabel: 'Open flagged questions',
    },
  }[activeSection];

  if (isLoading || error || relationships.length === 0) {
    return (
      <RelationshipListState
        isLoading={isLoading}
        error={error}
        isEmpty={relationships.length === 0}
        emptyTitle="No tutors yet"
        emptyDescription="When you become connected with a tutor, they will appear in this action-first view."
      />
    );
  }

  return (
    <div className="grid gap-4">
      <Card>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          {copy.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {copy.description}
        </p>
      </Card>

      {relationships.map((relationship) => (
        <SupportRelationshipCard
          key={`${activeSection}-${relationship.id}`}
          relationship={relationship}
          viewerRole="student"
          actions={[
            {
              label: copy.buttonLabel,
              href: getStudentActionHref(relationship.id, activeSection),
            },
          ]}
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

function getStudentActionHref(
  relationshipId: string,
  activeSection: Section
) {
  const baseHref = `/student/dashboard/support/${relationshipId}`;

  if (activeSection === 'resources') {
    return `${baseHref}/resources`;
  }

  if (activeSection === 'flagged-questions') {
    return `${baseHref}/questions`;
  }

  return `${baseHref}/messages`;
}