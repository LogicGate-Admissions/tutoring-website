'use client';

/**
 * File purpose:
 * Shared relationship card used by student and tutor dashboards.
 *
 * The card gives a compact overview of the relationship and surfaces message
 * activity. The global notification bell handles app-wide unread awareness,
 * while this card gives context once the user is on the dashboard.
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

          <LatestMessageSummary relationship={relationship} />
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {relationship.hasUnreadMessageActivity ? (
            <MetricBadge label="New message" value={relationship.unreadMessageCount} active />
          ) : (
            <MetricBadge label="Unread" value={relationship.unreadMessageCount} />
          )}
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

function LatestMessageSummary({
  relationship,
}: {
  relationship: RelationshipSupportSummary;
}) {
  if (!relationship.latestMessagePreview) {
    return (
      <p className="mt-2 text-sm text-slate-500">
        No messages yet. Start the conversation from Message.
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Latest message
      </p>
      <p className="mt-1 line-clamp-2 text-sm text-slate-700">
        <span className="font-semibold text-slate-900">
          {relationship.latestMessageSenderName || 'Unknown user'}:
        </span>{' '}
        {relationship.latestMessagePreview}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {formatCardTime(relationship.latestMessageAt)}
      </p>
    </div>
  );
}

function MetricBadge({
  label,
  value,
  active = false,
}: {
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <span
      className={
        active
          ? 'rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white'
          : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700'
      }
    >
      {value} {label}
    </span>
  );
}

function formatCardTime(value?: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
