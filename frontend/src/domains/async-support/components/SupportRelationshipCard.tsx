'use client';

/**
 * File purpose:
 * Shared relationship card used by both student and tutor dashboards.
 *
 * The same card is used by student and tutor dashboards to show an active support relationship.
 */

import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import type {
  AsyncSupportRole,
  RelationshipSupportSummary,
} from '@/domains/async-support/types/asyncSupport';

type SupportRelationshipAction = {
  label: string;
  href: string;
};

type SupportRelationshipCardProps = {
  relationship: RelationshipSupportSummary;
  viewerRole: AsyncSupportRole;
  actions: SupportRelationshipAction[];
};

export function SupportRelationshipCard({
  relationship,
  viewerRole,
  actions,
}: SupportRelationshipCardProps) {
  const otherPersonName =
    viewerRole === 'tutor' ? relationship.studentName : relationship.tutorName;

  const otherPersonLabel = viewerRole === 'tutor' ? 'Student' : 'Tutor';

  return (
    <Card className="grid gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {otherPersonLabel}
          </p>

          <h2 className="mt-1 text-lg font-semibold text-slate-950">
            {otherPersonName || 'Unnamed relationship'}
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            {relationship.level} {relationship.subject}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {relationship.lastMessagePreview || 'No messages yet.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <MetricBadge label="Unread" value={relationship.unreadMessageCount} />
          <MetricBadge label="Questions" value={relationship.openQuestionCount} />
          <MetricBadge label="Resources" value={relationship.resourceCount} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button key={action.label} href={action.href} variant="secondary">
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}

function MetricBadge({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {value} {label}
    </span>
  );
}