'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/shared/constants/firestoreCollections';
import {
  createBookingRequest,
  rescheduleBookingRequest,
} from '@/domains/booking/services/bookingService';
import { BookingConflictError, SlotUnavailableError } from '@/domains/booking/types/booking';
import type { Day, TimeBlock } from '@/domains/students/learning-profile/types/learningProfile';
import { timeToMinutes } from '@/domains/students/learning-profile/utils/timeBlocks';
import {
  getBlockStyle,
  normaliseGridRange,
  SLOT_HEIGHT,
  TIME_SLOTS,
  snapMouseYToGridMinutes,
} from '@/domains/students/learning-profile/utils/availabilityGridMath';
import { TimeLabels } from '@/domains/students/learning-profile/components/availability/AvailabilityGridLayout';
import { cn } from '@/shared/utils/cn';
import { formatStoredSubjectLabel } from '@/shared/utils/subjectLabels';

// ─── Date helpers ─────────────────────────────────────────────────────────────

const JS_DAY_NAMES: Day[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLUMN_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LONG_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayOfWeek(date: Date): Day {
  return JS_DAY_NAMES[date.getDay()];
}

function blocksForDate(blocks: TimeBlock[], date: Date): TimeBlock[] {
  const dow = dayOfWeek(date);
  return blocks.filter((b) => b.day === dow);
}

function intersectBlocks(a: TimeBlock[], b: TimeBlock[]): TimeBlock[] {
  const result: TimeBlock[] = [];
  for (const t of a) {
    for (const s of b) {
      const from = t.from > s.from ? t.from : s.from;
      const to = t.to < s.to ? t.to : s.to;
      if (from < to) {
        result.push({ id: `${t.id}x${s.id}`, day: t.day, from, to, source: 'manual' });
      }
    }
  }
  return result;
}

function formatDraftSummary(date: Date, from: string, to: string): string {
  const duration = timeToMinutes(to) - timeToMinutes(from);
  return `${LONG_DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} · ${from}-${to} (${duration} min)`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DragState = { dateStr: string; startMinutes: number; endMinutes: number };
type BookingDraft = { date: Date; from: string; to: string };

export type BookingSubjectOption = {
  label: string;
  subject: string;
  level?: string;
};

function normaliseText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normaliseSubjectOptions(options: BookingSubjectOption[]) {
  const seen = new Set<string>();

  return options
    .map((option) => ({
      label: normaliseText(formatStoredSubjectLabel(option)),
      subject: normaliseText(option.subject || option.label),
      level: normaliseText(option.level ?? ''),
    }))
    .filter((option) => option.label && option.subject)
    .filter((option) => {
      const key = `${option.level}:${option.subject}:${option.label}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function subjectOptionsFromTutorProfile(data: Record<string, unknown>) {
  const subjectRates = Array.isArray(data.subjectRates) ? data.subjectRates : [];
  const rateOptions = subjectRates.flatMap((item): BookingSubjectOption[] => {
    const rate = item as Record<string, unknown>;
    const level = String(rate.qualification ?? '').trim();
    const subject = String(rate.subject ?? '').trim();

    if (!subject) return [];

    return [{
      level,
      subject,
      label: formatStoredSubjectLabel({ level, subject }),
    }];
  });

  if (rateOptions.length > 0) {
    return normaliseSubjectOptions(rateOptions);
  }

  const subjects = Array.isArray(data.subjects) ? data.subjects.map(String) : [];

  return normaliseSubjectOptions(
    subjects.map((subject) => ({
      subject,
      label: subject,
    }))
  );
}

function getInitialSubject({
  relationshipSubjectOptions,
  prefilledSubject,
  existingSubject,
}: {
  relationshipSubjectOptions?: BookingSubjectOption[];
  prefilledSubject?: string;
  existingSubject?: string;
}) {
  const relationshipOptions = normaliseSubjectOptions(relationshipSubjectOptions ?? []);

  if (existingSubject) return existingSubject;
  if (relationshipOptions.length === 1) return relationshipOptions[0].label;
  if (prefilledSubject) return prefilledSubject;

  return '';
}

export type DragToBookCalendarProps = {
  tutorId: string;
  studentId: string;
  /** Display name of the other party (tutor name for students, student name for tutors). */
  counterpartyName: string;
  initiatedBy: 'tutor' | 'student';
  studentAvailabilityBlocks: TimeBlock[];
  onSuccess: () => void;
  onCancel: () => void;
  mode?: 'create' | 'reschedule';
  /** Required when mode is 'reschedule'. */
  existingBooking?: {
    id: string;
    subject: string;
    durationMinutes: number;
  };
  /** Legacy single subject fallback. */
  prefilledSubject?: string;
  /** Subjects agreed in the accepted match. One option is auto-selected; multiple options are shown as a dropdown. */
  relationshipSubjectOptions?: BookingSubjectOption[];
};

// ─── Component ────────────────────────────────────────────────────────────────

export function DragToBookCalendar({
  tutorId,
  studentId,
  counterpartyName,
  initiatedBy,
  studentAvailabilityBlocks,
  onSuccess,
  onCancel,
  mode = 'create',
  existingBooking,
  prefilledSubject,
  relationshipSubjectOptions,
}: DragToBookCalendarProps) {
  const isReschedule = mode === 'reschedule';
  const [tutorAvailBlocks, setTutorAvailBlocks] = useState<TimeBlock[]>([]);
  const [tutorSubjectOptions, setTutorSubjectOptions] = useState<BookingSubjectOption[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [bookingDraft, setBookingDraft] = useState<BookingDraft | null>(null);

  const [subject, setSubject] = useState(() =>
    getInitialSubject({
      relationshipSubjectOptions,
      prefilledSubject,
      existingSubject: existingBooking?.subject,
    })
  );
  const [nowInfo, setNowInfo] = useState<{ top: number; label: string }>(() => {
    const now = new Date();
    return {
      top: ((now.getHours() * 60 + now.getMinutes()) / 30) * SLOT_HEIGHT,
      label: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
  });
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const dragStateRef = useRef<DragState | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Keep drag ref in sync with state so document listeners always see current value
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  // Fetch tutor's profile (subjects + availability) - personalised per tutorId
  useEffect(() => {
    let cancelled = false;
    getDoc(doc(db, FIRESTORE_COLLECTIONS.tutorProfiles, tutorId))
      .then((snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          setProfileError('Tutor profile not found.');
          setProfileLoading(false);
          return;
        }
        const data = snap.data() as Record<string, unknown>;
        setTutorSubjectOptions(subjectOptionsFromTutorProfile(data));
        setTutorAvailBlocks((data.availabilityBlocks as TimeBlock[]) ?? []);
        setProfileLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setProfileError('Could not load availability.');
          setProfileLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [tutorId]);

  const relationshipOptions = useMemo(
    () => normaliseSubjectOptions(relationshipSubjectOptions ?? []),
    [relationshipSubjectOptions]
  );

  const effectiveSubjectOptions = relationshipOptions.length > 0
    ? relationshipOptions
    : tutorSubjectOptions;

  const shouldShowSubjectPicker = !isReschedule && effectiveSubjectOptions.length !== 1;
  const shouldShowFixedSubject = !isReschedule && effectiveSubjectOptions.length === 1;

  const autoSelectedSubject = !isReschedule && effectiveSubjectOptions.length === 1
    ? effectiveSubjectOptions[0].label
    : '';

  function getResolvedSubject() {
    if (isReschedule) return existingBooking?.subject || subject;
    return subject || autoSelectedSubject || prefilledSubject || '';
  }

  // Document-level mouse handlers - registered once, read state via ref
  useEffect(() => {
    function onMouseMove(e: globalThis.MouseEvent) {
      const current = dragStateRef.current;
      if (!current) return;
      const col = columnRefs.current.get(current.dateStr);
      if (!col) return;
      const { top, height } = col.getBoundingClientRect();
      const minutes = snapMouseYToGridMinutes({ clientY: e.clientY, columnTop: top, columnHeight: height });
      setDragState((prev) => (prev ? { ...prev, endMinutes: minutes } : null));
    }

    function onMouseUp() {
      const current = dragStateRef.current;
      if (!current) return;
      const { from, to } = normaliseGridRange(current.startMinutes, current.endMinutes);
      if (timeToMinutes(to) - timeToMinutes(from) >= 30) {
        const [y, mo, d] = current.dateStr.split('-').map(Number);
        setBookingDraft({ date: new Date(y, mo - 1, d), from, to });
      }
      setDragState(null);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Scroll to 8 AM on first render so working hours are visible immediately
  useEffect(() => {
    if (scrollContainerRef.current) {
      // 8 hours × 2 slots/hr × SLOT_HEIGHT px/slot
      scrollContainerRef.current.scrollTop = 8 * 2 * SLOT_HEIGHT;
    }
  }, []);

  // Current-time line: update every 60 s
  useEffect(() => {
    function computeNowInfo() {
      const now = new Date();
      return {
        top: ((now.getHours() * 60 + now.getMinutes()) / 30) * SLOT_HEIGHT,
        label: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      };
    }
    const id = setInterval(() => setNowInfo(computeNowInfo()), 60_000);
    return () => clearInterval(id);
  }, []);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const thisMonday = useMemo(() => getMonday(new Date()), []);

  const weekLabel = useMemo(() => {
    const s = weekDates[0];
    const e = weekDates[6];
    if (s.getMonth() === e.getMonth()) {
      return `${s.getDate()}-${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
    }
    return `${s.getDate()} ${MONTHS[s.getMonth()]}-${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
  }, [weekDates]);

  function goToPrevWeek() {
    setWeekStart((prev) => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; });
    setBookingDraft(null);
    setDragState(null);
  }

  function goToNextWeek() {
    setWeekStart((prev) => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; });
    setBookingDraft(null);
    setDragState(null);
  }

  function handleColumnMouseDown(dateStr: string, clientY: number) {
    const [y, mo, d] = dateStr.split('-').map(Number);
    if (new Date(y, mo - 1, d) < today) return;
    const col = columnRefs.current.get(dateStr);
    if (!col) return;
    const { top, height } = col.getBoundingClientRect();
    const minutes = snapMouseYToGridMinutes({ clientY, columnTop: top, columnHeight: height });
    setDragState({ dateStr, startMinutes: minutes, endMinutes: minutes });
    setBookingDraft(null);
    setSubmitError(null);
  }

  async function handleSubmit() {
    if (!bookingDraft) return;
    setFormError(null);
    const effectiveSubject = getResolvedSubject();
    if (!effectiveSubject) { setFormError('Please select a subject.'); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { date, from, to } = bookingDraft;
      const [hour, minute] = from.split(':').map(Number);
      const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
      const durationMinutes = timeToMinutes(to) - timeToMinutes(from);

      if (isReschedule && existingBooking) {
        await rescheduleBookingRequest(
          existingBooking.id,
          sessionDate,
          durationMinutes,
          initiatedBy
        );
        setToast('Session rescheduled');
      } else {
        await createBookingRequest({
          tutorId,
          studentId,
          initiatedBy,
          subject: effectiveSubject,
          date: sessionDate,
          durationMinutes,
          notes: notes.trim() || undefined,
        });
        setToast('Request sent - waiting for confirmation');
      }
      setTimeout(() => { setToast(null); onSuccess(); }, 2000);
    } catch (err) {
      if (err instanceof SlotUnavailableError) {
        setSubmitError(err.message);
      } else if (err instanceof BookingConflictError) {
        setSubmitError('That time overlaps another confirmed session.');
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (profileLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading availability…</p>
      </div>
    );
  }
  if (profileError) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
        <p className="text-sm text-rose-700">{profileError}</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {toast ? (
        <div className="absolute inset-x-6 top-4 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <h2 className="text-xl font-semibold tracking-tight text-slate-950">
        {isReschedule ? 'Reschedule session' : 'Book a session'} with {counterpartyName}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {isReschedule
          ? 'Drag on the calendar to pick a new time. Green shows availability overlap - any time works.'
          : 'Drag on the calendar to select a session time. Green shows availability overlap - any time works.'}
      </p>

      {/* Week navigation */}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={goToPrevWeek}
          disabled={weekStart <= thisMonday}
          className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
        >
          ← Prev
        </button>
        <span className="flex-1 text-center text-sm font-medium text-slate-700">{weekLabel}</span>
        <button
          type="button"
          onClick={goToNextWeek}
          className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Next →
        </button>
      </div>

      {/* Calendar grid */}
      <div
        ref={scrollContainerRef}
        className="mt-3 overflow-auto rounded-xl border border-slate-200 select-none"
        style={{ maxHeight: 360 }}
      >
        {/* Sticky date-column header */}
        <div className="sticky top-0 z-20 grid grid-cols-[64px_repeat(7,minmax(72px,1fr))] border-b border-slate-200 bg-white">
          <div className="border-r border-slate-200 p-2 text-xs font-medium text-slate-500">Time</div>
          {weekDates.map((date, i) => {
            const isPast = date < today;
            const isToday = toDateStr(date) === toDateStr(today);
            return (
              <div
                key={i}
                className={cn('border-r border-slate-200 p-2 text-center last:border-r-0', isPast && 'opacity-40')}
              >
                <div className="text-xs font-semibold text-slate-500">{COLUMN_DAY_LABELS[i]}</div>
                <div className={cn('text-sm font-bold', isToday ? 'text-indigo-600' : 'text-slate-900')}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid body: time labels + 7 day columns */}
        <div className="grid grid-cols-[64px_repeat(7,minmax(72px,1fr))]">
          <TimeLabels />
          {weekDates.map((date) => {
            const dateStr = toDateStr(date);
            const isPast = date < today;
            const tutorDay = blocksForDate(tutorAvailBlocks, date);
            const studentDay = blocksForDate(studentAvailabilityBlocks, date);
            const intersected = intersectBlocks(tutorDay, studentDay);

            const liveDraft = dragState?.dateStr === dateStr
              ? normaliseGridRange(dragState.startMinutes, dragState.endMinutes)
              : null;
            const draftBlock = bookingDraft && toDateStr(bookingDraft.date) === dateStr
              ? bookingDraft
              : null;

            // Fake TimeBlock for getBlockStyle (day field unused by getBlockStyle)
            const draftDay = dayOfWeek(date);

            const isToday = toDateStr(date) === toDateStr(new Date());

            return (
              <div
                key={dateStr}
                ref={(el) => {
                  if (el) columnRefs.current.set(dateStr, el);
                  else columnRefs.current.delete(dateStr);
                }}
                className={cn(
                  'relative border-l border-slate-200',
                  isPast ? 'cursor-not-allowed opacity-40' : 'cursor-crosshair'
                )}
                style={{ height: TIME_SLOTS.length * SLOT_HEIGHT }}
                onMouseDown={(e) => { e.preventDefault(); handleColumnMouseDown(dateStr, e.clientY); }}
              >
                {/* Slot grid lines */}
                {TIME_SLOTS.map((slot) => (
                  <div
                    key={slot}
                    style={{ height: SLOT_HEIGHT }}
                    className={cn('pointer-events-none border-b', slot.endsWith(':00') ? 'border-slate-200' : 'border-slate-100')}
                  />
                ))}

                {/* Current-time indicator */}
                {isToday && (
                  <div
                    className="absolute inset-x-0 z-10 flex cursor-default items-center"
                    style={{ top: nowInfo.top }}
                    title={nowInfo.label}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                    <div className="h-px flex-1 bg-red-500" />
                  </div>
                )}

                {/* Tutor availability (gray) */}
                {tutorDay.map((b) => (
                  <div
                    key={b.id}
                    style={getBlockStyle(b)}
                    className="pointer-events-none absolute inset-x-0.5 rounded bg-slate-200 border border-slate-400 opacity-60"
                  />
                ))}

                {/* Student availability (blue) */}
                {studentDay.map((b) => (
                  <div
                    key={b.id}
                    style={getBlockStyle(b)}
                    className="pointer-events-none absolute inset-x-0.5 rounded bg-blue-100 border border-blue-300 opacity-60"
                  />
                ))}

                {/* Intersection (green) */}
                {intersected.map((b) => (
                  <div
                    key={b.id}
                    style={getBlockStyle(b)}
                    className="pointer-events-none absolute inset-x-0.5 rounded bg-emerald-100 border border-emerald-400"
                  />
                ))}

                {/* Live drag preview (indigo, semi-transparent) */}
                {liveDraft ? (
                  <div
                    style={getBlockStyle({ id: 'drag', day: draftDay, from: liveDraft.from, to: liveDraft.to, source: 'manual' })}
                    className="pointer-events-none absolute inset-x-0.5 rounded border border-indigo-500 bg-indigo-300 opacity-80"
                  />
                ) : null}

                {/* Confirmed booking selection (solid indigo) */}
                {draftBlock ? (
                  <div
                    style={getBlockStyle({ id: 'draft', day: draftDay, from: draftBlock.from, to: draftBlock.to, source: 'manual' })}
                    className="pointer-events-none absolute inset-x-0.5 rounded border-2 border-indigo-600 bg-indigo-400"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-slate-400 bg-slate-200" />
          {initiatedBy === 'tutor' ? 'Your availability' : "Tutor's availability"}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-blue-300 bg-blue-100" />
          {initiatedBy === 'tutor' ? "Student's availability" : 'Your availability'}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-emerald-400 bg-emerald-100" />
          Mutually available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-indigo-600 bg-indigo-400" />
          Your selection
        </span>
      </div>

      {/* Booking form - shown after a drag selection is made */}
      {bookingDraft ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-950">Selected time</h3>
          <p className="mt-0.5 text-sm text-slate-600">
            {formatDraftSummary(bookingDraft.date, bookingDraft.from, bookingDraft.to)}
          </p>

          <div className="mt-4 grid gap-4">
            <div>
              <label htmlFor="dtbc-subject" className="block text-sm font-medium text-slate-700">
                Subject
              </label>
              {isReschedule || shouldShowFixedSubject ? (
                <p className="mt-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900">
                  {getResolvedSubject() || existingBooking?.subject || 'Subject not selected'}
                </p>
              ) : shouldShowSubjectPicker ? (
                <select
                  id="dtbc-subject"
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); setFormError(null); }}
                  className={cn(
                    'mt-1.5 w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-slate-900 focus:ring-offset-2',
                    formError ? 'border-rose-400' : 'border-slate-300'
                  )}
                >
                  <option value="">Select a subject…</option>
                  {effectiveSubjectOptions.map((option) => (
                    <option key={`${option.level}:${option.subject}:${option.label}`} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="mt-1.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                  No subjects are available for this tutor yet.
                </p>
              )}
              {formError ? <p className="mt-1 text-xs text-rose-600">{formError}</p> : null}
            </div>

            {!isReschedule ? (
              <div>
                <label htmlFor="dtbc-notes" className="block text-sm font-medium text-slate-700">
                  Notes <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="dtbc-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Topics to cover, questions, or anything else…"
                  className="mt-1.5 w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                />
              </div>
            ) : null}

            {submitError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {submitError}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <div
                role="button"
                tabIndex={0}
                onClick={() => void handleSubmit()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') void handleSubmit(); }}
                aria-disabled={submitting}
                className={cn(
                  'inline-flex cursor-pointer items-center justify-center rounded-full bg-slate-950 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2',
                  submitting && 'pointer-events-none opacity-60'
                )}
              >
                {submitting
                  ? isReschedule ? 'Rescheduling…' : 'Sending…'
                  : isReschedule ? 'Confirm reschedule' : 'Send request'}
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => { setBookingDraft(null); setFormError(null); setSubmitError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setBookingDraft(null); setFormError(null); setSubmitError(null); } }}
                className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              >
                Clear selection
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-500">
            Click and drag on the calendar above to select a session time, then fill in the details.
          </p>
          <div
            role="button"
            tabIndex={0}
            onClick={onCancel}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCancel(); }}
            className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            Cancel
          </div>
        </div>
      )}
    </div>
  );
}
