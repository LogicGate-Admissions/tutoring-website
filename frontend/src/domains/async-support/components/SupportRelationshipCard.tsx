'use client';

/**
 * File purpose:
 * Shared relationship card used by student and tutor dashboards.
 *
 * The card gives a compact overview of the relationship and surfaces message
 * activity. The global notification bell handles app-wide unread awareness,
 * while this card gives context once the user is on the dashboard.
 */

import { useMemo, useState } from 'react';
import { BookSessionModal } from '@/domains/booking/components/BookSessionModal';
import { Button } from '@/shared/components/Button';
import { useRelationshipBookings } from '@/domains/booking/hooks/useRelationshipBookings';
import { Card } from '@/shared/components/Card';
import type { BookingRequest } from '@/domains/booking/types/booking';
import type {
  AsyncSupportRole,
  RelationshipSupportSummary,
  RelationshipTutoringSubject,
} from '@/domains/async-support/types/asyncSupport';
import { TutorProfileModal } from '@/domains/tutors/tutor-discovery/components/TutorProfileModal';
import { getTutorProfile } from '@/domains/tutors/tutor-discovery/services/tutorProfileService';
import type { Tutor } from '@/domains/tutors/tutor-discovery/types/tutor';
import type { BookingSubjectOption } from '@/domains/booking/components/DragToBookCalendar';
import { StudentProfileModal } from '@/domains/students/learning-profile/components/StudentProfileModal';
import { getStudentLearningProfileById } from '@/domains/students/learning-profile/services/learningProfileStorage';
import type { StudentLearningProfile } from '@/domains/students/learning-profile/types/learningProfile';

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
  const [profileForModal, setProfileForModal] = useState<Tutor | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [studentProfileForModal, setStudentProfileForModal] = useState<{
    studentName: string;
    profile: StudentLearningProfile;
  } | null>(null);
  const [isLoadingStudentProfile, setIsLoadingStudentProfile] = useState(false);

  async function handleTutorNameClick() {
    if (isLoadingProfile) return;
    setIsLoadingProfile(true);
    try {
      const profile = await getTutorProfile(relationship.tutorId);
      setProfileForModal(profile);
    } finally {
      setIsLoadingProfile(false);
    }
  }


  async function handleStudentNameClick() {
    if (isLoadingStudentProfile) return;
    setIsLoadingStudentProfile(true);
    try {
      const profile = await getStudentLearningProfileById(relationship.studentId);
      setStudentProfileForModal({
        studentName: relationship.studentName,
        profile,
      });
    } finally {
      setIsLoadingStudentProfile(false);
    }
  }
  const { upcomingSession } = useRelationshipBookings(
    relationship.tutorId,
    relationship.studentId
  );

  const otherPersonName =
    viewerRole === 'tutor' ? relationship.studentName : relationship.tutorName;

  const otherPersonLabel = viewerRole === 'tutor' ? 'Student' : 'Tutor';

  const actionsWithBooking = useMemo(() => {
    const withoutBookSession = actions.filter((action) => action.label !== 'Book session');
    const bookSessionAction: SupportRelationshipAction = {
      label: 'Book session',
      onClick: () => setShowBooking(true),
    };
    const workspaceIndex = withoutBookSession.findIndex(
      (action) => action.label === 'Workspace'
    );

    if (workspaceIndex >= 0) {
      return [
        ...withoutBookSession.slice(0, workspaceIndex),
        bookSessionAction,
        ...withoutBookSession.slice(workspaceIndex),
      ];
    }

    return [...withoutBookSession, bookSessionAction];
  }, [actions]);

  const relationshipSubjectLabel = getRelationshipSubjectLabel(relationship);
  const relationshipBookingSubjectOptions = useMemo(
    () => getRelationshipBookingSubjectOptions(relationship),
    [relationship]
  );

  return (
    <>
      <Card className="grid gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {otherPersonLabel}
            </p>

            {viewerRole === 'student' ? (
              <ProfileNameButton
                label={isLoadingProfile ? 'Loading...' : (otherPersonName || 'Unnamed')}
                disabled={isLoadingProfile}
                onClick={() => void handleTutorNameClick()}
              />
            ) : (
              <ProfileNameButton
                label={isLoadingStudentProfile ? 'Loading...' : (otherPersonName || 'Unnamed')}
                disabled={isLoadingStudentProfile}
                onClick={() => void handleStudentNameClick()}
              />
            )}

            <p className="mt-1 text-sm text-slate-600">
              {relationshipSubjectLabel}
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
            <MetricBadge label="Shared resources" value={relationship.resourceCount} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {actionsWithBooking.map((action) => (
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
          subject={relationshipBookingSubjectOptions.length === 1 ? relationshipBookingSubjectOptions[0].label : undefined}
          subjectOptions={relationshipBookingSubjectOptions}
        />
      ) : null}

      {profileForModal ? (
        <TutorProfileModal
          tutor={profileForModal}
          readOnly
          onClose={() => setProfileForModal(null)}
        />
      ) : null}

      {studentProfileForModal ? (
        <StudentProfileModal
          studentName={studentProfileForModal.studentName}
          profile={studentProfileForModal.profile}
          onClose={() => setStudentProfileForModal(null)}
        />
      ) : null}
    </>
  );
}


function getRelationshipSubjectLabel(relationship: RelationshipSupportSummary) {
  const requestedSubjects = relationship.requestedSubjects ?? [];

  if (requestedSubjects.length > 0) {
    return requestedSubjects.map((subject) => subject.label).join(', ');
  }

  return [relationship.level, relationship.subject].filter(Boolean).join(' ') || 'Subject not specified';
}

function getRelationshipBookingSubjectOptions(
  relationship: RelationshipSupportSummary
): BookingSubjectOption[] {
  const requestedSubjects = relationship.requestedSubjects ?? [];

  if (requestedSubjects.length > 0) {
    return requestedSubjects.map(subjectToBookingOption);
  }

  const label = [relationship.level, relationship.subject].filter(Boolean).join(' ') || relationship.subject;

  return label
    ? [{
        level: relationship.level,
        subject: relationship.subject || label,
        label,
      }]
    : [];
}

function subjectToBookingOption(subject: RelationshipTutoringSubject): BookingSubjectOption {
  return {
    level: subject.level,
    subject: subject.subject,
    label: subject.label || [subject.level, subject.subject].filter(Boolean).join(' ') || subject.subject,
  };
}

function ProfileNameButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-100 disabled:opacity-60"
    >
      {label}
      <ProfileIcon />
    </button>
  );
}

function ProfileIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
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
