'use client';

/**
 * File purpose:
 * Shared page for relationship support features.
 *
 * Relationship feature page for messages and shared resources.
 */

import { useEffect, useState } from 'react';
import { MessageThread } from '@/domains/async-support/components/MessageThread';
import { ResourcesPanel } from '@/domains/async-support/components/ResourcesPanel';
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
    description: 'Send messages, screenshots, files, and lesson questions for this tutoring relationship.',
    emptyTitle: 'Messages',
    emptyDescription: 'Use the message composer below to start the conversation.',
  },
  questions: {
    title: 'Flagged questions',
    description: 'A planned space for students to flag academic questions between sessions.',
    emptyTitle: 'Flagged questions not implemented yet',
    emptyDescription:
      'This stays as a placeholder until the flagged-question feature issue is implemented.',
  },
  resources: {
    title: 'Shared resources',
    description:
      'Upload and open worksheets, screenshots, notes, and lesson materials for this relationship.',
    emptyTitle: 'No shared resources yet',
    emptyDescription:
      'Upload the first resource to make it available to both student and tutor.',
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {copy.title}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {copy.description}
              </p>
            </div>

            {relationship ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 lg:min-w-64">
                <p>
                  <span className="font-semibold">With:</span>{' '}
                  {otherPersonName || 'Unknown person'}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">Subject:</span>{' '}
                  {relationship.level} {relationship.subject}
                </p>
              </div>
            ) : null}
          </div>
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
          <MessageThread
            relationshipId={relationshipId}
            viewerRole={viewerRole}
            showHeader={false}
          />
        ) : feature === 'resources' ? (
          <Card>
            <ResourcesPanel relationshipId={relationshipId} viewerRole={viewerRole} />
          </Card>
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
