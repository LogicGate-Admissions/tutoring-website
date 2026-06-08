'use client';

/**
 * File purpose: My Sessions tab shown in both student and tutor dashboards.
 *
 * Three sections: pending requests, upcoming confirmed sessions, and a weekly
 * calendar view of this week's confirmed sessions. All data comes from
 * useBookings; no Firestore logic lives here.
 */

import { useEffect, useState } from 'react';
import { useBookings } from '@/domains/booking/hooks/useBookings';
import { useMeetingLinkProvisioner } from '@/domains/booking/hooks/useMeetingLinkProvisioner';
import { BookingRequestCard } from '@/domains/booking/components/BookingRequestCard';
import type { BookingRequest } from '@/domains/booking/types/booking';
import { cn } from '@/shared/utils/cn';
import { getStudentAvailabilityById } from '@/domains/students/learning-profile/services/learningProfileStorage';
import type { TimeBlock } from '@/domains/students/learning-profile/types/learningProfile';
import { DragToBookCalendar } from '@/domains/booking/components/DragToBookCalendar';
import { JoinSessionLink } from '@/domains/booking/components/JoinSessionLink';

const MAX_VISIBLE = 4;

const HOUR_START = 7;   // 07:00
const HOUR_END = 22;    // 22:00
const TOTAL_HOURS = HOUR_END - HOUR_START;
const SLOT_HEIGHT_REM = 3.5; // rem per hour

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export type Counterparty = {
  id: string;
  name: string;
};

type MySessionsTabProps = {
  userId: string;
  role: 'tutor' | 'student';
  /** People the viewer can book with: tutors for students, students for tutors. */
  counterparties: Counterparty[];
  /** Resolve the other party's display name for a given booking card. */
  getOtherPartyName: (booking: BookingRequest) => string;
};

type BookingStep =
  | { type: 'idle' }
  | { type: 'picking' }
  | { type: 'form'; counterparty: Counterparty };

type ModalSection = 'pending' | 'sent' | 'upcoming' | 'past' | null;

export function MySessionsTab({
  userId,
  role,
  counterparties,
  getOtherPartyName,
}: MySessionsTabProps) {
  const { pendingRequests, sentRequests, upcomingSessions, pastSessions, allSessions, loading, error } =
    useBookings(userId, role);

  useMeetingLinkProvisioner(upcomingSessions);

  const [step, setStep] = useState<BookingStep>({ type: 'idle' });
  const [modalSection, setModalSection] = useState<ModalSection>(null);
  const [studentAvailForBooking, setStudentAvailForBooking] = useState<TimeBlock[]>([]);

  useEffect(() => {
    if (step.type !== 'form') return;
    let active = true;
    // Tutor: fetch the student counterparty's availability for the overlay.
    // Student: fetch their own availability so the calendar can show the intersection.
    const idToFetch = role === 'tutor' ? step.counterparty.id : userId;
    getStudentAvailabilityById(idToFetch)
      .then((blocks) => { if (active) setStudentAvailForBooking(blocks); })
      .catch(() => {});
    return () => {
      active = false;
      setStudentAvailForBooking([]);
    };
  }, [step, role, userId]);

  function openBooking() {
    if (counterparties.length === 0) return;
    if (counterparties.length === 1) {
      setStep({ type: 'form', counterparty: counterparties[0] });
    } else {
      setStep({ type: 'picking' });
    }
  }

  function closeBooking() {
    setStep({ type: 'idle' });
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading sessions…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
        <p className="text-sm text-rose-700">Could not load your sessions. Please refresh.</p>
      </div>
    );
  }

  const MODAL_DATA: Record<NonNullable<ModalSection>, { title: string; bookings: BookingRequest[]; isPast?: boolean }> = {
    pending:  { title: 'Pending Requests',  bookings: pendingRequests },
    sent:     { title: 'Sent Requests',     bookings: sentRequests },
    upcoming: { title: 'Upcoming Sessions', bookings: upcomingSessions },
    past:     { title: 'Past Sessions',     bookings: pastSessions, isPast: true },
  };

  return (
    <div className="grid gap-8">
      {modalSection && (
        <SessionsModal
          {...MODAL_DATA[modalSection]}
          viewerRole={role}
          viewerId={userId}
          getOtherPartyName={getOtherPartyName}
          onClose={() => setModalSection(null)}
        />
      )}

      {/* ── Pending Requests ─────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Pending Requests</SectionHeading>
        {pendingRequests.length === 0 ? (
          <EmptyState message="No pending requests." />
        ) : (
          <div className="mt-4 grid gap-4">
            {pendingRequests.slice(0, MAX_VISIBLE).map((b) => (
              <BookingRequestCard
                key={b.id}
                booking={b}
                viewerRole={role}
                viewerId={userId}
                otherPartyName={getOtherPartyName(b)}
              />
            ))}
            {pendingRequests.length > MAX_VISIBLE && (
              <SeeAllLink count={pendingRequests.length} onClick={() => setModalSection('pending')} />
            )}
          </div>
        )}
      </section>

      {/* ── Sent Requests ────────────────────────────────────────────────── */}
      {sentRequests.length > 0 ? (
        <section>
          <SectionHeading>Sent Requests</SectionHeading>
          <p className="mt-1 text-sm text-slate-500">
            Waiting for the other party to respond.
          </p>
          <div className="mt-4 grid gap-4">
            {sentRequests.slice(0, MAX_VISIBLE).map((b) => (
              <BookingRequestCard
                key={b.id}
                booking={b}
                viewerRole={role}
                viewerId={userId}
                otherPartyName={getOtherPartyName(b)}
              />
            ))}
            {sentRequests.length > MAX_VISIBLE && (
              <SeeAllLink count={sentRequests.length} onClick={() => setModalSection('sent')} />
            )}
          </div>
        </section>
      ) : null}

      {/* ── Upcoming Sessions ─────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Upcoming Sessions</SectionHeading>

        {step.type === 'picking' ? (
          <CounterpartyPicker
            counterparties={counterparties}
            role={role}
            onSelect={(cp) => setStep({ type: 'form', counterparty: cp })}
            onCancel={closeBooking}
          />
        ) : step.type === 'form' ? (
          <div className="mt-4">
            <DragToBookCalendar
              tutorId={role === 'student' ? step.counterparty.id : userId}
              studentId={role === 'tutor' ? step.counterparty.id : userId}
              counterpartyName={step.counterparty.name}
              initiatedBy={role}
              studentAvailabilityBlocks={studentAvailForBooking}
              onSuccess={closeBooking}
              onCancel={closeBooking}
            />
          </div>
        ) : upcomingSessions.length === 0 ? (
          <div className="mt-4 flex flex-col items-start gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">No upcoming sessions scheduled.</p>
            {counterparties.length > 0 ? (
              <BookSessionButton onClick={openBooking} />
            ) : null}
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            <div className="flex items-center justify-between">
              <span />
              {counterparties.length > 0 ? (
                <BookSessionButton onClick={openBooking} />
              ) : null}
            </div>
            {upcomingSessions.slice(0, MAX_VISIBLE).map((b) => (
              <BookingRequestCard
                key={b.id}
                booking={b}
                viewerRole={role}
                viewerId={userId}
                otherPartyName={getOtherPartyName(b)}
              />
            ))}
            {upcomingSessions.length > MAX_VISIBLE && (
              <SeeAllLink count={upcomingSessions.length} onClick={() => setModalSection('upcoming')} />
            )}
          </div>
        )}
      </section>

      {/* ── Weekly Calendar View ──────────────────────────────────────────── */}
      <section>
        <SectionHeading>Calendar</SectionHeading>
        <div className="relative mt-4 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <WeeklyCalendar
            sessions={allSessions}
            getOtherPartyName={getOtherPartyName}
            onBookSession={counterparties.length > 0 ? openBooking : undefined}
          />
        </div>
      </section>

      {/* Past sessions (no heading in spec; shown below for completeness) */}
      {pastSessions.length > 0 ? (
        <section>
          <SectionHeading>Past Sessions</SectionHeading>
          <div className="mt-4 grid gap-4">
            {pastSessions.slice(0, MAX_VISIBLE).map((b) => (
              <BookingRequestCard
                key={b.id}
                booking={b}
                viewerRole={role}
                viewerId={userId}
                otherPartyName={getOtherPartyName(b)}
                isPast={true}
              />
            ))}
            {pastSessions.length > MAX_VISIBLE && (
              <SeeAllLink count={pastSessions.length} onClick={() => setModalSection('past')} />
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

// ─── Counterparty picker ──────────────────────────────────────────────────────

function CounterpartyPicker({
  counterparties,
  role,
  onSelect,
  onCancel,
}: {
  counterparties: Counterparty[];
  role: 'tutor' | 'student';
  onSelect: (cp: Counterparty) => void;
  onCancel: () => void;
}) {
  const label = role === 'student' ? 'tutor' : 'student';

  return (
    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-950">
        Choose a {label} to book with
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Select which {label} this session is with.
      </p>

      <div className="mt-4 grid gap-2">
        {counterparties.map((cp) => (
          <div
            key={cp.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(cp)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect(cp);
            }}
            className={cn(
              'flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 transition',
              'hover:border-slate-950 hover:bg-slate-50',
              'focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2'
            )}
          >
            <span className="text-sm font-medium text-slate-900">{cp.name}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="h-4 w-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 3l5 5-5 5" />
            </svg>
          </div>
        ))}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={onCancel}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onCancel();
        }}
        className="mt-4 inline-flex cursor-pointer items-center text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline focus:outline-none"
      >
        Cancel
      </div>
    </div>
  );
}

// ─── Weekly Calendar ──────────────────────────────────────────────────────────

/** Returns the Monday of the ISO week containing `date`. */
function weekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function sessionTopPercent(date: Date): number {
  const startMinute = (date.getHours() - HOUR_START) * 60 + date.getMinutes();
  return (startMinute / (TOTAL_HOURS * 60)) * 100;
}

function sessionHeightPercent(durationMinutes: number): number {
  return (durationMinutes / (TOTAL_HOURS * 60)) * 100;
}

function WeeklyCalendar({
  sessions,
  getOtherPartyName,
  onBookSession,
}: {
  sessions: BookingRequest[];
  getOtherPartyName: (b: BookingRequest) => string;
  onBookSession?: () => void;
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  const monday = addDays(weekStart(new Date()), weekOffset * 7);
  const weekDays = DAY_LABELS.map((_, i) => addDays(monday, i));
  const sunday = weekDays[6];

  const thisWeekSessions = sessions.filter((s) =>
    weekDays.some((d) => isSameDay(s.date.toDate(), d))
  );

  const totalHeightRem = TOTAL_HOURS * SLOT_HEIGHT_REM;

  const weekLabel = `${monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="relative">
      {/* Week navigation header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div
          role="button"
          tabIndex={0}
          aria-label="Previous week"
          onClick={() => setWeekOffset((o) => o - 1)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setWeekOffset((o) => o - 1); }}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-950 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3L5 8l5 5" /></svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-950">{weekLabel}</p>
          {weekOffset !== 0 && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setWeekOffset(0)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setWeekOffset(0); }}
              className="mt-0.5 cursor-pointer text-xs text-slate-400 underline underline-offset-2 hover:text-slate-600 focus:outline-none"
            >
              Back to today
            </div>
          )}
        </div>
        <div
          role="button"
          tabIndex={0}
          aria-label="Next week"
          onClick={() => setWeekOffset((o) => o + 1)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setWeekOffset((o) => o + 1); }}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-950 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3l5 5-5 5" /></svg>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[3rem_repeat(7,minmax(5rem,1fr))] border-b border-slate-200">
        <div className="border-r border-slate-100 py-3" />
        {weekDays.map((day, i) => (
          <div
            key={i}
            className="border-r border-slate-100 px-2 py-3 last:border-r-0"
          >
            <p className="text-center text-xs font-semibold text-slate-700">
              {DAY_LABELS[i]}
            </p>
            <p className="mt-0.5 text-center text-[0.65rem] text-slate-400">
              {formatDayLabel(day)}
            </p>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div
        className="grid grid-cols-[3rem_repeat(7,minmax(5rem,1fr))]"
        style={{ height: `${totalHeightRem}rem` }}
      >
        {/* Time labels column */}
        <div className="relative border-r border-slate-100">
          {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-t border-slate-100 pr-1 pt-0.5"
              style={{ top: `${(i / TOTAL_HOURS) * 100}%` }}
            >
              <span className="block text-right text-[0.6rem] leading-none text-slate-400">
                {`${String(HOUR_START + i).padStart(2, '0')}:00`}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((day, colIdx) => {
          const daySessions = thisWeekSessions.filter((s) =>
            isSameDay(s.date.toDate(), day)
          );

          return (
            <div
              key={colIdx}
              className="relative border-r border-slate-100 last:border-r-0"
            >
              {/* Hour lines */}
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-x-0 border-t border-slate-100"
                  style={{ top: `${(i / TOTAL_HOURS) * 100}%` }}
                />
              ))}

              {/* Session blocks */}
              {daySessions.map((s) => {
                const start = s.date.toDate();
                const top = sessionTopPercent(start);
                const height = sessionHeightPercent(s.durationMinutes);
                const timeLabel = start.toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={s.id}
                    className="absolute inset-x-0.5 overflow-hidden rounded-xl bg-slate-900 px-2 py-1"
                    style={{ top: `${top}%`, height: `${height}%` }}
                  >
                    <p className="truncate text-[0.6rem] font-semibold leading-tight text-white">
                      {s.subject}
                    </p>
                    <p className="truncate text-[0.55rem] leading-tight text-slate-300">
                      {timeLabel} · {getOtherPartyName(s)}
                    </p>
                    {s.date.toDate() > new Date() ? (
                      <JoinSessionLink booking={s} variant="compact" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Empty-week CTA overlay */}
      {thisWeekSessions.length === 0 && onBookSession ? (
        <div className="absolute inset-0 flex items-center justify-end p-6 pointer-events-none">
          <div className="pointer-events-auto">
            <BookSessionButton onClick={onBookSession} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold tracking-tight text-slate-950">
      {children}
    </h2>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="mt-3 text-sm italic text-slate-400">{message}</p>
  );
}

// ─── Sessions Modal ───────────────────────────────────────────────────────────

function SessionsModal({
  title,
  bookings,
  viewerRole,
  viewerId,
  getOtherPartyName,
  isPast,
  onClose,
}: {
  title: string;
  bookings: BookingRequest[];
  viewerRole: 'tutor' | 'student';
  viewerId: string;
  getOtherPartyName: (b: BookingRequest) => string;
  isPast?: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <div
            role="button"
            tabIndex={0}
            onClick={onClose}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
            aria-label="Close"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4">
            {bookings.map((b) => (
              <BookingRequestCard
                key={b.id}
                booking={b}
                viewerRole={viewerRole}
                viewerId={viewerId}
                otherPartyName={getOtherPartyName(b)}
                isPast={isPast}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── See All Link ─────────────────────────────────────────────────────────────

function SeeAllLink({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className="mt-1 cursor-pointer text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline focus:outline-none"
    >
      See all {count} →
    </div>
  );
}

function BookSessionButton({ onClick }: { onClick: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      className={cn(
        'inline-flex cursor-pointer items-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition',
        'hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2'
      )}
    >
      Book a session
    </div>
  );
}
