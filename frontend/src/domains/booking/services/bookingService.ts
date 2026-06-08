/**
 * File purpose: Pure async functions for the booking lifecycle.
 *
 * No React, no hooks. All Firestore reads/writes for booking requests go
 * through this file. Components call the booking hook; the hook calls this
 * service only for mutations (useBookings handles reads via onSnapshot).
 */

import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/shared/constants/firestoreCollections';
import {
  BookingConflictError,
  BookingRequest,
  BookingStatus,
  CreateBookingInput,
  SlotUnavailableError,
} from '@/domains/booking/types/booking';
import type { BookingNotificationType } from '@/domains/booking/types/bookingNotification';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function castBooking(id: string, data: Record<string, unknown>): BookingRequest {
  return {
    id,
    tutorId: data.tutorId as string,
    studentId: data.studentId as string,
    initiatedBy: data.initiatedBy as 'tutor' | 'student',
    subject: data.subject as string,
    date: data.date as Timestamp,
    durationMinutes: data.durationMinutes as number,
    notes: data.notes as string | undefined,
    status: data.status as BookingStatus,
    tutorAccepted: Boolean(data.tutorAccepted),
    studentAccepted: Boolean(data.studentAccepted),
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
    confirmedAt: data.confirmedAt as Timestamp | undefined,
    cancelledByRole: data.cancelledByRole as 'tutor' | 'student' | undefined,
    rescheduledByRole: data.rescheduledByRole as 'tutor' | 'student' | undefined,
  };
}

/** Check whether two sessions overlap in time. */
function sessionsOverlap(
  aStart: Date,
  aDurationMinutes: number,
  bStart: Date,
  bDurationMinutes: number
): boolean {
  const aEnd = new Date(aStart.getTime() + aDurationMinutes * 60_000);
  const bEnd = new Date(bStart.getTime() + bDurationMinutes * 60_000);
  return aStart < bEnd && aEnd > bStart;
}

// ─── Subject validation (availability is advisory only in the UI) ─────────────

async function assertTutorOffersSubject(
  tutorId: string,
  subject: string
): Promise<void> {
  const tutorSnap = await getDoc(
    doc(db, FIRESTORE_COLLECTIONS.tutorProfiles, tutorId)
  );

  if (!tutorSnap.exists()) {
    throw new SlotUnavailableError('Tutor profile not found.');
  }

  const subjects: string[] = tutorSnap.data().subjects ?? [];

  if (!subjects.includes(subject)) {
    throw new SlotUnavailableError('The requested subject is not offered by this tutor.');
  }
}

// ─── Conflict detection ───────────────────────────────────────────────────────

// SCHEMA ASSUMPTION: Conflict check is best-effort; full atomicity requires a
// Cloud Function. The JS SDK does not support queries inside runTransaction.
async function assertNoConflict(
  tutorId: string,
  date: Date,
  durationMinutes: number,
  excludeBookingId?: string
): Promise<void> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.bookingRequests),
    where('tutorId', '==', tutorId),
    where('status', '==', 'confirmed'),
    where('date', '>=', Timestamp.fromDate(dayStart)),
    where('date', '<=', Timestamp.fromDate(dayEnd))
  );

  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    if (docSnap.id === excludeBookingId) continue;
    const other = castBooking(docSnap.id, docSnap.data());
    const otherStart = other.date.toDate();
    if (sessionsOverlap(date, durationMinutes, otherStart, other.durationMinutes)) {
      throw new BookingConflictError();
    }
  }
}

// ─── Notification helper ──────────────────────────────────────────────────────

async function createBookingNotification(
  userId: string,
  bookingId: string,
  type: BookingNotificationType,
  message: string
): Promise<void> {
  await addDoc(collection(db, FIRESTORE_COLLECTIONS.bookingNotifications), {
    userId,
    type,
    bookingId,
    message,
    read: false,
    createdAt: Timestamp.now(),
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a new booking request.
 * Validates the tutor offers the requested subject. Availability is advisory in the UI only.
 * Returns the new document ID.
 */
export async function createBookingRequest(
  data: CreateBookingInput
): Promise<string> {
  await assertTutorOffersSubject(data.tutorId, data.subject);

  const now = Timestamp.now();

  const docRef = await addDoc(
    collection(db, FIRESTORE_COLLECTIONS.bookingRequests),
    {
      tutorId: data.tutorId,
      studentId: data.studentId,
      initiatedBy: data.initiatedBy,
      subject: data.subject,
      date: Timestamp.fromDate(data.date),
      durationMinutes: data.durationMinutes,
      notes: data.notes ?? null,
      status: 'pending_receiver',
      // Requester implicitly accepts by sending; receiver must accept to confirm.
      tutorAccepted: data.initiatedBy === 'tutor',
      studentAccepted: data.initiatedBy === 'student',
      createdAt: now,
      updatedAt: now,
    }
  );

  const receiverId =
    data.initiatedBy === 'student' ? data.tutorId : data.studentId;

  const dateStr = data.date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  await createBookingNotification(
    receiverId,
    docRef.id,
    'booking_request',
    `New ${data.subject} session requested for ${dateStr}`
  );

  return docRef.id;
}

/**
 * Accept a booking request.
 * Uses a Firestore transaction to:
 *   1. Read the current document.
 *   2. Set the caller's acceptance flag.
 *   3. If both parties have now accepted, check for conflicts then confirm.
 */
export async function acceptBookingRequest(
  bookingId: string,
  role: 'tutor' | 'student'
): Promise<void> {
  const bookingRef = doc(db, FIRESTORE_COLLECTIONS.bookingRequests, bookingId);

  let confirmedBooking: BookingRequest | null = null;

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(bookingRef);
    if (!snap.exists()) throw new Error('Booking not found.');

    const booking = castBooking(snap.id, snap.data());

    const tutorAccepted = role === 'tutor' ? true : booking.tutorAccepted;
    const studentAccepted = role === 'student' ? true : booking.studentAccepted;
    const bothAccepted = tutorAccepted && studentAccepted;
    const now = Timestamp.now();

    if (bothAccepted) {
      // FUTURE: payment gate — trigger payment intent creation here before confirming
      transaction.update(bookingRef, {
        tutorAccepted,
        studentAccepted,
        status: 'confirmed',
        confirmedAt: now,
        updatedAt: now,
      });
      confirmedBooking = { ...booking, tutorAccepted, studentAccepted };
    } else {
      const nextStatus: BookingStatus =
        booking.status === 'pending_receiver' ? 'pending_requester' : booking.status;

      transaction.update(bookingRef, {
        tutorAccepted,
        studentAccepted,
        status: nextStatus,
        updatedAt: now,
      });
    }
  });

  if (confirmedBooking !== null) {
    const b = confirmedBooking as BookingRequest;
    // Post-transaction conflict check (best-effort — see SCHEMA ASSUMPTION above)
    await assertNoConflict(b.tutorId, b.date.toDate(), b.durationMinutes, bookingId);

    const dateStr = b.date.toDate().toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    const notifyUserId = role === 'tutor' ? b.studentId : b.tutorId;
    await createBookingNotification(
      notifyUserId,
      bookingId,
      'booking_accepted',
      `Your ${b.subject} session on ${dateStr} is confirmed`
    );
  } else {
    // Receiver just accepted; notify the requester that their turn has come
    const snap = await getDoc(bookingRef);
    if (snap.exists()) {
      const b = castBooking(snap.id, snap.data());
      const requesterId = b.initiatedBy === 'student' ? b.studentId : b.tutorId;
      const dateStr = b.date.toDate().toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      await createBookingNotification(
        requesterId,
        bookingId,
        'booking_accepted',
        `Accepted — confirm your ${b.subject} session on ${dateStr}`
      );
    }
  }
}

/**
 * Decline a booking request (receiver only).
 * Sets status to 'declined' and notifies the requester.
 */
export async function declineBookingRequest(bookingId: string): Promise<void> {
  const bookingRef = doc(db, FIRESTORE_COLLECTIONS.bookingRequests, bookingId);
  const snap = await getDoc(bookingRef);
  if (!snap.exists()) throw new Error('Booking not found.');

  const booking = castBooking(snap.id, snap.data());

  await runTransaction(db, async (transaction) => {
    transaction.update(bookingRef, {
      status: 'declined',
      updatedAt: Timestamp.now(),
    });
  });

  const requesterId =
    booking.initiatedBy === 'student' ? booking.studentId : booking.tutorId;

  const dateStr = booking.date.toDate().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  await createBookingNotification(
    requesterId,
    bookingId,
    'booking_declined',
    `Your ${booking.subject} session request for ${dateStr} was declined`
  );
}

/**
 * Cancel a booking request or confirmed session (either party).
 * Sets status to 'cancelled' and notifies the other party.
 */
export async function cancelBookingRequest(
  bookingId: string,
  cancelledByRole: 'tutor' | 'student'
): Promise<void> {
  const bookingRef = doc(db, FIRESTORE_COLLECTIONS.bookingRequests, bookingId);
  const snap = await getDoc(bookingRef);
  if (!snap.exists()) throw new Error('Booking not found.');

  const booking = castBooking(snap.id, snap.data());

  await runTransaction(db, async (transaction) => {
    transaction.update(bookingRef, {
      status: 'cancelled',
      cancelledByRole,
      updatedAt: Timestamp.now(),
    });
  });

  const otherUserId =
    cancelledByRole === 'tutor' ? booking.studentId : booking.tutorId;

  const dateStr = booking.date.toDate().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  await createBookingNotification(
    otherUserId,
    bookingId,
    'booking_cancelled',
    `Your ${booking.subject} session on ${dateStr} was cancelled`
  );
}

/**
 * Reschedule a confirmed or pending future session to a new date/time.
 * Checks for overlapping confirmed sessions before updating.
 */
export async function rescheduleBookingRequest(
  bookingId: string,
  newDate: Date,
  durationMinutes: number,
  rescheduledByRole: 'tutor' | 'student'
): Promise<void> {
  const bookingRef = doc(db, FIRESTORE_COLLECTIONS.bookingRequests, bookingId);
  const snap = await getDoc(bookingRef);
  if (!snap.exists()) throw new Error('Booking not found.');

  const booking = castBooking(snap.id, snap.data());

  const reschedulableStatuses: BookingStatus[] = [
    'confirmed',
    'pending_receiver',
    'pending_requester',
  ];
  if (!reschedulableStatuses.includes(booking.status)) {
    throw new Error('This session cannot be rescheduled.');
  }

  if (booking.date.toDate() <= new Date() && booking.status === 'confirmed') {
    throw new Error('Past sessions cannot be rescheduled.');
  }

  if (booking.status === 'confirmed') {
    await assertNoConflict(
      booking.tutorId,
      newDate,
      durationMinutes,
      bookingId
    );
  }

  const oldDateStr = booking.date.toDate().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const oldTimeStr = booking.date.toDate().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const newDateStr = newDate.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const newTimeStr = newDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  await runTransaction(db, async (transaction) => {
    transaction.update(bookingRef, {
      date: Timestamp.fromDate(newDate),
      durationMinutes,
      rescheduledByRole,
      updatedAt: Timestamp.now(),
    });
  });

  const otherUserId =
    rescheduledByRole === 'tutor' ? booking.studentId : booking.tutorId;

  await createBookingNotification(
    otherUserId,
    bookingId,
    'booking_rescheduled',
    `${booking.subject} session moved from ${oldDateStr} ${oldTimeStr} to ${newDateStr} ${newTimeStr}`
  );
}
