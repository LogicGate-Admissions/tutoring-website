'use client';

/**
 * File purpose:
 * Shared page for async-support features.
 *
 * In this messaging stage, the message thread is implemented. Flagged
 * questions and shared resources stay as placeholders for later feedback-led
 * iterations.
 */

import { useEffect, useState } from 'react';
import { MessageThread } from '@/domains/async-support/components/MessageThread';
import { getStudentTutorRelationshipById } from '@/domains/async-support/services/relationshipsService';
import type {
  AsyncSupportRole,
  StudentTutorRelationship,
} from '@/domains/async-support/types/asyncSupport';
import { AppTopNav } from '@/shared/components/AppTopNav';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { ROUTES } from '@/shared/constants/routes';

type SupportFeature = 'messages' | 'questions' | 'resources';

type SupportFeaturePageProps = {
  relationshipId: string;
  viewerRole: AsyncSupportRole;
  feature: SupportFeature;
};

const featureCopy: Record<
  SupportFeature,
  {
    title: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
  }
> = {
  messages: {
    title: 'Messages',
    description:
      'This is the shared async message thread for this tutoring relationship.',
    emptyTitle: 'Message thread',
    emptyDescription: 'Use the message composer below to start the conversation.',
  },
  questions: {
    title: 'Flagged questions',
    description:
      'A planned space for students to flag academic questions between sessions.',
    emptyTitle: 'Flagged questions not implemented yet',
    emptyDescription:
      'This stays as a placeholder until the flagged-question feature issue is implemented.',
  },
  resources: {
    title: 'Shared resources',
    description:
      'A planned space for links, notes, worksheets, and lesson materials.',
    emptyTitle: 'Shared resources not implemented yet',
    emptyDescription:
      'This stays as a placeholder until the shared-resource feature issue is implemented.',
  },
};

export function SupportFeaturePage({
  relationshipId,
  viewerRole,
  feature,
}: SupportFeaturePageProps) {
  const [relationship, setRelationship] =
    useState<StudentTutorRelationship | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navUserType = viewerRole === 'student' ? 'student' : 'tutor';
  const dashboardHref =
    viewerRole === 'student' ? ROUTES.studentDashboard : ROUTES.tutorDashboard;

  useEffect(() => {
    let isActive = true;

    async function loadRelationship() {
      try {
        setIsLoading(true);
        setError(null);

        const loadedRelationship =
          await getStudentTutorRelationshipById(relationshipId);

        if (!isActive) {
          return;
        }

        setRelationship(loadedRelationship);

        if (!loadedRelationship) {
          setError('This support relationship could not be found.');
        }
      } catch {
        if (!isActive) {
          return;
        }

        setError('Could not load this support relationship.');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadRelationship();

    return () => {
      isActive = false;
    };
  }, [relationshipId]);

  const copy = featureCopy[feature];
  const otherPersonName =
    viewerRole === 'student' ? relationship?.tutorName : relationship?.studentName;

  return (
    <>
      <AppTopNav userType={navUserType} />

      <Container className="grid gap-6 py-8">
        <div>
          <Button href={dashboardHref} variant="secondary">
            Back to dashboard
          </Button>
        </div>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Async support
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {copy.title}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            {copy.description}
          </p>

          {relationship ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Relationship:</span>{' '}
                {otherPersonName || 'Unknown person'}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Subject:</span>{' '}
                {relationship.level} {relationship.subject}
              </p>
            </div>
          ) : null}
        </Card>

        {isLoading ? (
          <Card>
            <p className="text-sm text-slate-600">Loading support space...</p>
          </Card>
        ) : error ? (
          <Card>
            <h2 className="text-lg font-semibold text-slate-950">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
          </Card>
        ) : feature === 'messages' ? (
          <MessageThread relationshipId={relationshipId} viewerRole={viewerRole} />
        ) : (
          <Card>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              {copy.emptyTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy.emptyDescription}
            </p>
          </Card>
        )}
      </Container>
    </>
  );
}
