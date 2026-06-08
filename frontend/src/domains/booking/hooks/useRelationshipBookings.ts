'use client';

/**
 * Real-time confirmed bookings between a specific tutor and student pair.
 * Used in the message thread to surface the next upcoming session + Meet link.
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

const EMPTY_BOOKINGS: BookingRequest[] = [];

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
    meetingLink: data.meetingLink as string | undefined,
    calendarEventId: data.calendarEventId as string | undefined,
    meetingLinkStatus: data.meetingLinkStatus as BookingRequest['meetingLinkStatus'],
  };
}

export function useRelationshipBookings(
  tutorId: string | undefined,
  studentId: string | undefined
) {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const hasRelationshipPair = Boolean(tutorId && studentId);

  useEffect(() => {
    if (!hasRelationshipPair || !tutorId || !studentId) return;

    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.bookingRequests),
      where('tutorId', '==', tutorId),
      where('studentId', '==', studentId),
      where('status', '==', 'confirmed')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs
          .map((d) => toBookingRequest(d.id, d.data()))
          .sort((a, b) => a.date.toMillis() - b.date.toMillis());
        setBookings(next);
        setLoading(false);
      },
      () => {
        setBookings([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [hasRelationshipPair, tutorId, studentId]);

  const visibleBookings = hasRelationshipPair ? bookings : EMPTY_BOOKINGS;

  const upcomingSession = useMemo(() => {
    const now = new Date();
    return visibleBookings.find((b) => b.date.toDate() > now) ?? null;
  }, [visibleBookings]);

  return {
    bookings: visibleBookings,
    upcomingSession,
    loading: hasRelationshipPair ? loading : false,
  };
}
