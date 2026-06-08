'use client';

/**
 * File purpose:
 * Shared relationship card used by student and tutor dashboards.
 *
 * The card gives a compact overview of the relationship and surfaces message
 * activity. The global notification bell handles app-wide unread awareness,
 * while this card gives context once the user is on the dashboard.
 */

import { useState } from 'react';
import { BookSessionModal } from '@/domains/booking/components/BookSessionModal';
import { Button } from '@/shared/components/Button';
import { useRelationshipBookings } from '@/domains/booking/hooks/useRelationshipBookings';
import { Card } from '@/shared/components/Card';
import type { BookingRequest } from '@/domains/booking/types/booking';
import type {
  AsyncSupportRole,
  RelationshipSupportSummary,
} from '@/domains/async-support/types/asyncSupport';

type SupportRelationshipAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
};

type SupportRelationshipCardProps = {
  relationship: RelationshipSupportSummary;
  viewerRole: AsyncSupportRole;
  currentUserId: string;
  actions: SupportRelationshipAction[];
};

export function SupportRelationshipCard({
  relationship,
  viewerRole,
  currentUserId,
  actions,
}: SupportRelationshipCardProps) {
  const [showBooking, setShowBooking] = useState(false);
  const { upcomingSession } = useRelationshipBookings(
    relationship.tutorId,
    relationship.studentId
  );

  const otherPersonName =
    viewerRole === 'tutor' ? relationship.studentName : relationship.tutorName;

  const otherPersonLabel = viewerRole === 'tutor' ? 'Student' : 'Tutor';

  return (
    <>
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
            <NextLessonSummary booking={upcomingSession} />
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            {relationship.hasUnreadMessageActivity ? (
              <MetricBadge
                label={relationship.latestMessageUrgency === 'urgent' ? 'Urgent' : 'New message'}
                value={relationship.unreadMessageCount}
                active
                urgent={relationship.latestMessageUrgency === 'urgent'}
              />
            ) : (
              <MetricBadge label="Unread" value={relationship.unreadMessageCount} />
            )}
            <MetricBadge label="Questions" value={relationship.openQuestionCount} />
            <MetricBadge label="Resources" value={relationship.resourceCount} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => setShowBooking(true)}>
            Book session
          </Button>
          {actions.map((action) => (
            <RelationshipActionButton key={action.label} action={action} />
          ))}
        </div>
      </Card>

      {showBooking ? (
        <BookSessionModal
          isOpen
          onClose={() => setShowBooking(false)}
          tutorId={relationship.tutorId}
          studentId={relationship.studentId}
          counterpartyName={otherPersonName}
          initiatedBy={viewerRole}
          currentUserId={currentUserId}
        />
      ) : null}
    </>
  );
}

function RelationshipActionButton({ action }: { action: SupportRelationshipAction }) {
  if (action.href) {
    return (
      <Button href={action.href} variant="secondary" external={action.external}>
        {action.label}
      </Button>
    );
  }

  return (
    <Button onClick={action.onClick} variant="secondary">
      {action.label}
    </Button>
  );
}

function NextLessonSummary({ booking }: { booking: BookingRequest | null }) {
  if (!booking) {
    return (
      <p className="mt-3 text-xs text-slate-500">
        No upcoming lesson booked yet.
      </p>
    );
  }

  const start = booking.date.toDate();
  const dateLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(start);

  return (
    <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
        Next lesson
      </p>
      <p className="mt-1 text-sm font-medium text-emerald-950">
        {booking.subject} · {dateLabel}
      </p>
    </div>
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
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Latest message
        </p>
        {relationship.latestMessageUrgency === 'urgent' ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-red-700">
            Urgent
          </span>
        ) : null}
      </div>
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
  urgent = false,
}: {
  label: string;
  value: number;
  active?: boolean;
  urgent?: boolean;
}) {
  return (
    <span
      className={
        active
          ? urgent
            ? 'rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white'
            : 'rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white'
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
