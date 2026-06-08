'use client';

/**
 * File purpose: Real-time subscription to all booking requests for the current user.
 *
 * A single onSnapshot listener fetches every booking where this user is either
 * tutor or student (determined by role). All sub-arrays are derived client-side
 * from that one snapshot so components never trigger redundant Firestore reads.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/shared/constants/firestoreCollections';
import type { BookingRequest, BookingStatus } from '@/domains/booking/types/booking';

/** Cast raw Firestore data to a typed BookingRequest. */
function toBookingRequest(id: string, data: Record<string, unknown>): BookingRequest {
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
    meetingLink: data.meetingLink as string | undefined,
    calendarEventId: data.calendarEventId as string | undefined,
    meetingLinkStatus: data.meetingLinkStatus as BookingRequest['meetingLinkStatus'],
    lessonStatus: data.lessonStatus as BookingRequest['lessonStatus'],
    lessonStartedAt: data.lessonStartedAt as Timestamp | undefined,
    lessonEndedAt: data.lessonEndedAt as Timestamp | undefined,
  };
}

/** Returns true when the booking is one the given user needs to act on. */
function isPendingForUser(
  booking: BookingRequest,
  role: 'tutor' | 'student'
): boolean {
  const userIsInitiator =
    (role === 'tutor' && booking.initiatedBy === 'tutor') ||
    (role === 'student' && booking.initiatedBy === 'student');

  if (booking.status === 'pending_receiver') {
    return !userIsInitiator; // receiver needs to accept
  }
  if (booking.status === 'pending_requester') {
    return userIsInitiator; // requester needs to confirm
  }
  return false;
}

type UseBookingsResult = {
  /** Requests where this user needs to act (accept / confirm). */
  pendingRequests: BookingRequest[];
  /** Requests this user sent that are still awaiting the other party's response. */
  sentRequests: BookingRequest[];
  upcomingSessions: BookingRequest[];
  pastSessions: BookingRequest[];
  allSessions: BookingRequest[];
  loading: boolean;
  error: Error | null;
};

export function useBookings(
  userId: string,
  role: 'tutor' | 'student'
): UseBookingsResult {
  const [allBookings, setAllBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Keep loading while auth hasn't resolved yet
    if (!userId) {
      return;
    }

    const field = role === 'tutor' ? 'tutorId' : 'studentId';
    // No orderBy here — combining where() on one field with orderBy() on
    // another requires a composite Firestore index. Sort client-side instead.
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.bookingRequests),
      where(field, '==', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bookings = snapshot.docs
          .map((d) => toBookingRequest(d.id, d.data()))
          .sort((a, b) => b.date.toMillis() - a.date.toMillis());
        setAllBookings(bookings);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useBookings] Firestore error:', err);
        setAllBookings([]);
        setLoading(false);
        setError(err);
      }
    );

    return unsubscribe;
  }, [userId, role]);

  const now = new Date();

  const pendingRequests = useMemo(
    () => allBookings.filter((b) => isPendingForUser(b, role)),
    [allBookings, role]
  );

  const sentRequests = useMemo(
    () =>
      allBookings.filter((b) => {
        const userIsInitiator =
          (role === 'tutor' && b.initiatedBy === 'tutor') ||
          (role === 'student' && b.initiatedBy === 'student');
        
        return b.status === 'pending_receiver' && userIsInitiator;
      }),
    [allBookings, role]
  );

  const allSessions = useMemo(
    () => allBookings.filter((b) => b.status === 'confirmed'),
    [allBookings]
  );

  const upcomingSessions = useMemo(
    () => allSessions.filter((b) => b.date.toDate() > now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allSessions]
  );

  const pastSessions = useMemo(
    () => allSessions.filter((b) => b.date.toDate() <= now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allSessions]
  );

  return { pendingRequests, sentRequests, upcomingSessions, pastSessions, allSessions, loading, error };
}
