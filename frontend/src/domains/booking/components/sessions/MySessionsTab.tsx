'use client';

/**
 * File purpose: My Sessions tab shown in both student and tutor dashboards.
 *
 * Sections: pending requests, upcoming confirmed sessions, weekly calendar,
 * and past sessions. Booking new sessions happens from relationship cards
 * or the messages thread — not from this tab.
 */

import { useEffect, useRef, useState } from 'react';
import { useBookings } from '@/domains/booking/hooks/useBookings';
import { BookingRequestCard } from '@/domains/booking/components/BookingRequestCard';
import { createPortal } from 'react-dom';
import { SessionDetailModal } from '@/domains/booking/components/SessionDetailModal';
import { rescheduleBookingRequest } from '@/domains/booking/services/bookingService';
import type { BookingRequest } from '@/domains/booking/types/booking';
import { BookingConflictError } from '@/domains/booking/types/booking';
import { cn } from '@/shared/utils/cn';

const MAX_VISIBLE = 4;

const HOUR_START = 7;
const HOUR_END = 22;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const SLOT_HEIGHT_REM = 3.5;

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export type Counterparty = {
  id: string;
  name: string;
};

type MySessionsTabProps = {
  userId: string;
  role: 'tutor' | 'student';
  counterparties: Counterparty[];
  getOtherPartyName: (booking: BookingRequest) => string;
};

type ModalSection = 'pending' | 'sent' | 'upcoming' | 'past' | null;

export function MySessionsTab({
  userId,
  role,
  getOtherPartyName,
}: MySessionsTabProps) {
  const { pendingRequests, sentRequests, upcomingSessions, pastSessions, allSessions, loading, error } =
    useBookings(userId, role);

  const [modalSection, setModalSection] = useState<ModalSection>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [pendingReschedule, setPendingReschedule] = useState<{
    booking: BookingRequest;
    newDate: Date;
  } | null>(null);
  const [rescheduleBusy, setRescheduleBusy] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  async function confirmDragReschedule() {
    if (!pendingReschedule) return;
    setRescheduleBusy(true);
    setRescheduleError(null);
    try {
      await rescheduleBookingRequest(
        pendingReschedule.booking.id,
        pendingReschedule.newDate,
        pendingReschedule.booking.durationMinutes,
        role
      );
      setPendingReschedule(null);
    } catch (err) {
      if (err instanceof BookingConflictError) {
        setRescheduleError('That time overlaps another confirmed session.');
      } else {
        setRescheduleError(
          err instanceof Error ? err.message : 'Could not reschedule. Please try again.'
        );
      }
    } finally {
      setRescheduleBusy(false);
    }
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

      <section>
        <SectionHeading>Upcoming Sessions</SectionHeading>
        {upcomingSessions.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">No upcoming sessions scheduled.</p>
            <p className="mt-2 text-xs text-slate-400">
              Book a session from a tutor or student card, or from your message thread.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
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

      <section>
        <SectionHeading>Calendar</SectionHeading>
        <p className="mt-1 text-sm text-slate-500">
          Click a session for details. Drag a session to reschedule it.
        </p>
        <div className="relative mt-4 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <WeeklyCalendar
            sessions={allSessions}
            getOtherPartyName={getOtherPartyName}
            onSessionClick={setSelectedBooking}
            onRescheduleRequest={(booking, newDate) => {
              setRescheduleError(null);
              setPendingReschedule({ booking, newDate });
            }}
          />
        </div>
      </section>

      {selectedBooking ? (
        <SessionDetailModal
          booking={selectedBooking}
          otherPartyName={getOtherPartyName(selectedBooking)}
          viewerRole={role}
          viewerId={userId}
          onClose={() => setSelectedBooking(null)}
        />
      ) : null}

      {pendingReschedule ? (
        <RescheduleConfirmDialog
          booking={pendingReschedule.booking}
          newDate={pendingReschedule.newDate}
          busy={rescheduleBusy}
          error={rescheduleError}
          onConfirm={() => void confirmDragReschedule()}
          onCancel={() => {
            setPendingReschedule(null);
            setRescheduleError(null);
          }}
        />
      ) : null}

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

function weekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
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

function topPercentToDate(day: Date, topPercent: number): Date {
  const totalMinutes = TOTAL_HOURS * 60;
  const startMinute = (topPercent / 100) * totalMinutes;
  const snapped = Math.round(startMinute / 15) * 15;
  const hours = HOUR_START + Math.floor(snapped / 60);
  const minutes = snapped % 60;
  const d = new Date(day);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function isDraggableSession(booking: BookingRequest): boolean {
  if (booking.status !== 'confirmed') return false;
  return booking.date.toDate() > new Date();
}

const DRAG_THRESHOLD_PX = 8;

type PointerDragState = {
  booking: BookingRequest;
  startX: number;
  startY: number;
  active: boolean;
};

function WeeklyCalendar({
  sessions,
  getOtherPartyName,
  onSessionClick,
  onRescheduleRequest,
}: {
  sessions: BookingRequest[];
  getOtherPartyName: (b: BookingRequest) => string;
  onSessionClick: (booking: BookingRequest) => void;
  onRescheduleRequest: (booking: BookingRequest, newDate: Date) => void;
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<{ colIdx: number; topPercent: number } | null>(null);

  const columnRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const dragBookingRef = useRef<BookingRequest | null>(null);
  const dragPreviewRef = useRef<{ colIdx: number; topPercent: number } | null>(null);
  const pointerDragRef = useRef<PointerDragState | null>(null);
  const didDragRef = useRef(false);

  const monday = addDays(weekStart(new Date()), weekOffset * 7);
  const weekDays = DAY_LABELS.map((_, i) => addDays(monday, i));
  const sunday = weekDays[6];

  const thisWeekSessions = sessions.filter((s) =>
    weekDays.some((d) => isSameDay(s.date.toDate(), d))
  );

  const totalHeightRem = TOTAL_HOURS * SLOT_HEIGHT_REM;
  const weekLabel = `${monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const draggingBooking = draggingId
    ? sessions.find((s) => s.id === draggingId) ?? null
    : null;

  const weekDaysRef = useRef(weekDays);

  useEffect(() => {
    weekDaysRef.current = weekDays;
  }, [weekDays]);

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const pointer = pointerDragRef.current;
      if (!pointer) return;

      const dx = e.clientX - pointer.startX;
      const dy = e.clientY - pointer.startY;

      if (!pointer.active) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        pointer.active = true;
        didDragRef.current = true;
        dragBookingRef.current = pointer.booking;
        setDraggingId(pointer.booking.id);
        const start = pointer.booking.date.toDate();
        const colIdx = weekDaysRef.current.findIndex((d) => isSameDay(start, d));
        if (colIdx >= 0) {
          const preview = { colIdx, topPercent: sessionTopPercent(start) };
          dragPreviewRef.current = preview;
          setDragPreview(preview);
        }
      }

      for (const [colIdx, col] of columnRefs.current.entries()) {
        const rect = col.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right) {
          const relativeY = e.clientY - rect.top;
          const topPercent = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));
          const preview = { colIdx, topPercent };
          dragPreviewRef.current = preview;
          setDragPreview(preview);
          break;
        }
      }
    }

    function onPointerUp() {
      const booking = dragBookingRef.current;
      const preview = dragPreviewRef.current;
      const days = weekDaysRef.current;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const wasDrag = didDragRef.current;

      pointerDragRef.current = null;
      setDraggingId(null);
      setDragPreview(null);
      dragBookingRef.current = null;
      dragPreviewRef.current = null;

      window.setTimeout(() => { didDragRef.current = false; }, 0);

      if (!wasDrag || !booking || !preview) return;

      const targetDay = days[preview.colIdx];
      if (targetDay < todayStart) return;

      const newDate = topPercentToDate(targetDay, preview.topPercent);
      const originalDate = booking.date.toDate();

      if (
        originalDate.getTime() !== newDate.getTime() &&
        isDraggableSession(booking)
      ) {
        onRescheduleRequest(booking, newDate);
      }
    }

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    };
  }, [onRescheduleRequest]);

  function handlePointerDown(booking: BookingRequest, e: React.PointerEvent) {
    if (!isDraggableSession(booking)) return;
    didDragRef.current = false;
    pointerDragRef.current = {
      booking,
      startX: e.clientX,
      startY: e.clientY,
      active: false,
    };
  }

  function handleSessionClick(booking: BookingRequest) {
    if (didDragRef.current) return;
    onSessionClick(booking);
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <button
          type="button"
          aria-label="Previous week"
          onClick={() => setWeekOffset((o) => o - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-950 hover:text-slate-950"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3L5 8l5 5" /></svg>
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-950">{weekLabel}</p>
          {weekOffset !== 0 ? (
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="mt-0.5 text-xs text-slate-400 underline underline-offset-2 hover:text-slate-600"
            >
              Back to today
            </button>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Next week"
          onClick={() => setWeekOffset((o) => o + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-950 hover:text-slate-950"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3l5 5-5 5" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-[3rem_repeat(7,minmax(5rem,1fr))] border-b border-slate-200">
        <div className="border-r border-slate-100 py-3" />
        {weekDays.map((day, i) => (
          <div key={i} className="border-r border-slate-100 px-2 py-3 last:border-r-0">
            <p className="text-center text-xs font-semibold text-slate-700">{DAY_LABELS[i]}</p>
            <p className="mt-0.5 text-center text-[0.65rem] text-slate-400">{formatDayLabel(day)}</p>
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-[3rem_repeat(7,minmax(5rem,1fr))]"
        style={{ height: `${totalHeightRem}rem` }}
      >
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

        {weekDays.map((day, colIdx) => {
          const daySessions = thisWeekSessions.filter((s) =>
            isSameDay(s.date.toDate(), day)
          );
          const isDraggingHere = draggingBooking && dragPreview?.colIdx === colIdx;

          return (
            <div
              key={colIdx}
              ref={(el) => {
                if (el) columnRefs.current.set(colIdx, el);
                else columnRefs.current.delete(colIdx);
              }}
              className="relative border-r border-slate-100 last:border-r-0"
            >
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-x-0 border-t border-slate-100"
                  style={{ top: `${(i / TOTAL_HOURS) * 100}%` }}
                />
              ))}

              {daySessions.map((s) => {
                if (draggingId === s.id) return null;

                const start = s.date.toDate();
                const top = sessionTopPercent(start);
                const height = sessionHeightPercent(s.durationMinutes);
                const timeLabel = start.toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isPast = start <= new Date();
                const draggable = isDraggableSession(s);

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSessionClick(s)}
                    onPointerDown={(e) => handlePointerDown(s, e)}
                    className={cn(
                      'absolute inset-x-0.5 overflow-hidden rounded-xl px-2 py-1 text-left transition',
                      isPast
                        ? 'bg-slate-300 opacity-70'
                        : 'bg-slate-900 hover:bg-slate-800',
                      draggable && 'cursor-grab active:cursor-grabbing'
                    )}
                    style={{ top: `${top}%`, height: `${height}%`, minHeight: '1.5rem' }}
                    title={draggable ? 'Click for details, drag to reschedule' : 'Click for details'}
                  >
                    <p className="truncate text-[0.6rem] font-semibold leading-tight text-white">
                      {s.subject}
                    </p>
                    <p className="truncate text-[0.55rem] leading-tight text-slate-300">
                      {timeLabel} · {getOtherPartyName(s)}
                    </p>
                  </button>
                );
              })}

              {isDraggingHere && draggingBooking && dragPreview ? (
                <div
                  className="pointer-events-none absolute inset-x-0.5 overflow-hidden rounded-xl border-2 border-dashed border-indigo-400 bg-indigo-300/80 px-2 py-1 opacity-90"
                  style={{
                    top: `${dragPreview.topPercent}%`,
                    height: `${sessionHeightPercent(draggingBooking.durationMinutes)}%`,
                    minHeight: '1.5rem',
                  }}
                >
                  <p className="truncate text-[0.6rem] font-semibold leading-tight text-indigo-950">
                    {draggingBooking.subject}
                  </p>
                  <p className="truncate text-[0.55rem] leading-tight text-indigo-800">
                    New time
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {thisWeekSessions.length === 0 ? (
        <div className="border-t border-slate-100 px-6 py-8 text-center">
          <p className="text-sm text-slate-500">No sessions this week.</p>
        </div>
      ) : null}
    </div>
  );
}

function RescheduleConfirmDialog({
  booking,
  newDate,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  booking: BookingRequest;
  newDate: Date;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-slate-950">Reschedule session?</h3>
        <p className="mt-2 text-sm text-slate-600">
          Move <strong>{booking.subject}</strong> to{' '}
          {newDate.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}{' '}
          at{' '}
          {newDate.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          })}
          ? The other party will be notified.
        </p>
        {error ? (
          <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {busy ? 'Rescheduling…' : 'Yes, reschedule'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

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
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
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

function SeeAllLink({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
    >
      See all {count} →
    </button>
  );
}
