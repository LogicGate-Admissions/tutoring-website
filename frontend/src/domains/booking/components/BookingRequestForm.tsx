'use client';

/**
 * File purpose: Form for creating a new booking request.
 *
 * Fetches the tutor's subjects and availability blocks from Firestore on mount.
 * All field options are derived from that data so duration, time, and subject
 * are always valid against real tutor availability before the request is sent.
 */

import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/shared/constants/firestoreCollections';
import { createBookingRequest } from '@/domains/booking/services/bookingService';
import { SlotUnavailableError } from '@/domains/booking/types/booking';
import type { Day, TimeBlock } from '@/domains/students/learning-profile/types/learningProfile';
import { cn } from '@/shared/utils/cn';

const DAY_NAMES: Day[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DURATION_OPTIONS = [30, 45, 60, 90] as const;

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Returns the overlapping sub-blocks between two sets of availability blocks on the same day. */
function intersectBlocks(tutorBlocks: TimeBlock[], studentBlocks: TimeBlock[]): TimeBlock[] {
  const result: TimeBlock[] = [];
  for (const t of tutorBlocks) {
    for (const s of studentBlocks) {
      const from = t.from > s.from ? t.from : s.from;
      const to = t.to < s.to ? t.to : s.to;
      if (from < to) {
        result.push({ id: `${t.id}x${s.id}`, day: t.day, from, to, source: 'manual' });
      }
    }
  }
  return result;
}

/** Returns 30-minute-increment start times within a block where duration fits. */
function slotsForBlock(block: TimeBlock, durationMinutes: number): string[] {
  const slots: string[] = [];
  const from = timeToMinutes(block.from);
  const to = timeToMinutes(block.to);
  for (let t = from; t + durationMinutes <= to; t += 30) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

/** Returns all blocks from the tutor's availability for a given calendar date. */
function blocksForDate(blocks: TimeBlock[], date: Date): TimeBlock[] {
  const dayName = DAY_NAMES[date.getDay()];
  return blocks.filter((b) => b.day === dayName);
}

/** Minimum allowed slot length from blocks on a day (to populate valid duration options). */
function maxFittableDuration(block: TimeBlock): number {
  return timeToMinutes(block.to) - timeToMinutes(block.from);
}

type BookingRequestFormProps = {
  tutorId: string;
  tutorName: string;
  studentId: string;
  initiatedBy: 'tutor' | 'student';
  studentAvailabilityBlocks?: TimeBlock[];
  onSuccess: () => void;
  onCancel: () => void;
};

type FormState = {
  subject: string;
  date: string;       // ISO date string yyyy-mm-dd
  time: string;       // HH:mm
  durationMinutes: number;
  notes: string;
};

type FieldError = Partial<Record<keyof FormState, string>>;

export function BookingRequestForm({
  tutorId,
  tutorName,
  studentId,
  initiatedBy,
  studentAvailabilityBlocks,
  onSuccess,
  onCancel,
}: BookingRequestFormProps) {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<TimeBlock[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    subject: '',
    date: '',
    time: '',
    durationMinutes: 60,
    notes: '',
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getDoc(doc(db, FIRESTORE_COLLECTIONS.tutorProfiles, tutorId))
      .then((snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          setProfileError('Tutor profile not found.');
          return;
        }
        const data = snap.data();
        setSubjects((data.subjects as string[]) ?? []);
        setAvailabilityBlocks((data.availabilityBlocks as TimeBlock[]) ?? []);
        setProfileLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setProfileError('Could not load tutor availability.');
          setProfileLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tutorId]);

  const selectedDate = useMemo(
    () => (form.date ? new Date(`${form.date}T00:00:00`) : null),
    [form.date]
  );

  const dayBlocks = useMemo(() => {
    if (!selectedDate) return [];
    const tutorDay = blocksForDate(availabilityBlocks, selectedDate);
    if (!studentAvailabilityBlocks?.length) return tutorDay;
    const studentDay = blocksForDate(studentAvailabilityBlocks, selectedDate);
    return intersectBlocks(tutorDay, studentDay);
  }, [selectedDate, availabilityBlocks, studentAvailabilityBlocks]);

  const validDurations = useMemo(() => {
    if (dayBlocks.length === 0) return DURATION_OPTIONS as readonly number[];
    const maxMinutes = Math.max(...dayBlocks.map(maxFittableDuration));
    return DURATION_OPTIONS.filter((d) => d <= maxMinutes);
  }, [dayBlocks]);

  const availableTimeSlots = useMemo(() => {
    const duration = form.durationMinutes;
    const all = new Set<string>();
    for (const block of dayBlocks) {
      for (const slot of slotsForBlock(block, duration)) {
        all.add(slot);
      }
    }
    return Array.from(all).sort();
  }, [dayBlocks, form.durationMinutes]);

  const isTutorUnavailableOnDay = form.date !== '' && dayBlocks.length === 0;

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): FieldError {
    const errs: FieldError = {};
    if (!form.subject) errs.subject = 'Please select a subject.';
    if (!form.date) {
      errs.date = 'Please select a date.';
    } else if (isTutorUnavailableOnDay) {
      errs.date = studentAvailabilityBlocks?.length
        ? 'No mutually available time on this day. Please choose another date.'
        : 'The tutor is not available on this day. Please choose another date.';
    }
    if (!form.time) errs.time = 'Please select a start time.';
    if (!form.durationMinutes) errs.durationMinutes = 'Please select a duration.';
    return errs;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const [year, month, day] = form.date.split('-').map(Number);
      const [hour, minute] = form.time.split(':').map(Number);
      const sessionDate = new Date(year, month - 1, day, hour, minute, 0, 0);

      await createBookingRequest({
        tutorId,
        studentId,
        initiatedBy,
        subject: form.subject,
        date: sessionDate,
        durationMinutes: form.durationMinutes,
        notes: form.notes.trim() || undefined,
      });

      setToast('Request sent - waiting for confirmation');
      setTimeout(() => {
        setToast(null);
        onSuccess();
      }, 2000);
    } catch (err) {
      if (err instanceof SlotUnavailableError) {
        setSubmitError('That slot is no longer available. Please choose another time.');
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
        Book a session with {tutorName}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        All fields are required unless marked optional.
      </p>

      <div className="mt-6 grid gap-5">
        {/* Subject */}
        <div>
          <label
            htmlFor="booking-subject"
            className="block text-sm font-medium text-slate-700"
          >
            Subject
          </label>
          <select
            id="booking-subject"
            value={form.subject}
            onChange={(e) => setField('subject', e.target.value)}
            className={cn(
              'mt-1.5 w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition',
              'focus:ring-2 focus:ring-slate-900 focus:ring-offset-2',
              errors.subject ? 'border-rose-400' : 'border-slate-300'
            )}
          >
            <option value="">Select a subject…</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.subject ? (
            <p className="mt-1 text-xs text-rose-600">{errors.subject}</p>
          ) : null}
        </div>

        {/* Date */}
        <div>
          <label
            htmlFor="booking-date"
            className="block text-sm font-medium text-slate-700"
          >
            Date
          </label>
          <input
            id="booking-date"
            type="date"
            value={form.date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => {
              setField('date', e.target.value);
              setField('time', '');
            }}
            className={cn(
              'mt-1.5 w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition',
              'focus:ring-2 focus:ring-slate-900 focus:ring-offset-2',
              errors.date ? 'border-rose-400' : 'border-slate-300'
            )}
          />
          {isTutorUnavailableOnDay && !errors.date ? (
            <p className="mt-1 text-xs text-amber-600">
              {studentAvailabilityBlocks?.length
                ? 'No mutually available time on this day.'
                : 'Tutor has no availability on this day.'}
            </p>
          ) : null}
          {errors.date ? (
            <p className="mt-1 text-xs text-rose-600">{errors.date}</p>
          ) : null}
        </div>

        {/* Start time - only shown once a valid date is selected */}
        {form.date && !isTutorUnavailableOnDay ? (
          <div>
            <label
              htmlFor="booking-time"
              className="block text-sm font-medium text-slate-700"
            >
              Start time
            </label>
            <select
              id="booking-time"
              value={form.time}
              onChange={(e) => setField('time', e.target.value)}
              className={cn(
                'mt-1.5 w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition',
                'focus:ring-2 focus:ring-slate-900 focus:ring-offset-2',
                errors.time ? 'border-rose-400' : 'border-slate-300'
              )}
            >
              <option value="">Select a start time…</option>
              {availableTimeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            {availableTimeSlots.length === 0 ? (
              <p className="mt-1 text-xs text-amber-600">
                No slots available for the selected duration on this day.
              </p>
            ) : null}
            {errors.time ? (
              <p className="mt-1 text-xs text-rose-600">{errors.time}</p>
            ) : null}
          </div>
        ) : null}

        {/* Duration */}
        <div>
          <label
            htmlFor="booking-duration"
            className="block text-sm font-medium text-slate-700"
          >
            Duration
          </label>
          <select
            id="booking-duration"
            value={form.durationMinutes}
            onChange={(e) => {
              setField('durationMinutes', Number(e.target.value));
              setField('time', '');
            }}
            className={cn(
              'mt-1.5 w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition',
              'focus:ring-2 focus:ring-slate-900 focus:ring-offset-2',
              errors.durationMinutes ? 'border-rose-400' : 'border-slate-300'
            )}
          >
            {validDurations.map((d) => (
              <option key={d} value={d}>
                {d} min
              </option>
            ))}
          </select>
          {errors.durationMinutes ? (
            <p className="mt-1 text-xs text-rose-600">{errors.durationMinutes}</p>
          ) : null}
        </div>

        {/* Notes (optional) */}
        <div>
          <label
            htmlFor="booking-notes"
            className="block text-sm font-medium text-slate-700"
          >
            Notes{' '}
            <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="booking-notes"
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            rows={3}
            placeholder="Topics to cover, questions to ask, or anything else…"
            className="mt-1.5 w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          />
        </div>

        {submitError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') void handleSubmit();
            }}
            onClick={() => void handleSubmit()}
            aria-disabled={submitting}
            className={cn(
              'inline-flex cursor-pointer items-center justify-center rounded-full bg-slate-950 px-6 py-2.5 text-sm font-semibold text-white transition',
              'hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2',
              submitting && 'pointer-events-none opacity-60'
            )}
          >
            {submitting ? 'Sending…' : 'Send request'}
          </div>

          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onCancel();
            }}
            onClick={onCancel}
            className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            Cancel
          </div>
        </div>
      </div>
    </div>
  );
}
