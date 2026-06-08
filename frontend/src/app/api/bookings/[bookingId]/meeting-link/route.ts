/**
 * POST — create a Google Meet link for a confirmed booking and save it to Firestore.
 *
 * Called by the client when a session is confirmed (or when an existing confirmed
 * booking is missing a link). Requires Firebase Auth ID token.
 */

import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/shared/server/firebaseAdmin';
import {
  createSessionCalendarEvent,
  isCalendarConfigured,
} from '@/shared/server/googleCalendarService';
import { FIRESTORE_COLLECTIONS } from '@/shared/constants/firestoreCollections';

type BookingDoc = {
  tutorId: string;
  studentId: string;
  subject: string;
  date: Timestamp;
  durationMinutes: number;
  notes?: string;
  status: string;
  meetingLink?: string;
  calendarEventId?: string;
  meetingLinkStatus?: string;
};

async function verifyCaller(request: NextRequest): Promise<string | NextResponse> {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = header.slice('Bearer '.length);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
  }
}

async function getUserEmail(uid: string): Promise<string | null> {
  const snap = await adminDb.collection(FIRESTORE_COLLECTIONS.users).doc(uid).get();
  if (!snap.exists) return null;
  return (snap.data()?.email as string) ?? null;
}

async function getUserName(uid: string): Promise<string | undefined> {
  const snap = await adminDb.collection(FIRESTORE_COLLECTIONS.users).doc(uid).get();
  if (!snap.exists) return undefined;
  return (snap.data()?.name as string) ?? undefined;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    const callerResult = await verifyCaller(request);
    if (callerResult instanceof NextResponse) return callerResult;
    const callerId = callerResult;
    const { bookingId } = await context.params;

    const bookingRef = adminDb
      .collection(FIRESTORE_COLLECTIONS.bookingRequests)
      .doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookingSnap.data() as BookingDoc;

    if (callerId !== booking.tutorId && callerId !== booking.studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Meeting links are only created for confirmed sessions' },
        { status: 400 }
      );
    }

    if (booking.meetingLink && booking.meetingLinkStatus === 'ready') {
      return NextResponse.json({
        meetingLink: booking.meetingLink,
        meetingLinkStatus: 'ready',
        calendarEventId: booking.calendarEventId,
      });
    }

    if (!isCalendarConfigured()) {
      await bookingRef.update({
        meetingLinkStatus: 'skipped',
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json(
        {
          meetingLinkStatus: 'skipped',
          error: 'Google Calendar is not configured on the server',
        },
        { status: 503 }
      );
    }

    await bookingRef.update({
      meetingLinkStatus: 'pending',
      updatedAt: FieldValue.serverTimestamp(),
    });

    const [tutorEmail, studentEmail, tutorName, studentName] = await Promise.all([
      getUserEmail(booking.tutorId),
      getUserEmail(booking.studentId),
      getUserName(booking.tutorId),
      getUserName(booking.studentId),
    ]);

    if (!tutorEmail || !studentEmail) {
      await bookingRef.update({
        meetingLinkStatus: 'failed',
        meetingLinkError: 'Missing tutor or student email',
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json(
        { meetingLinkStatus: 'failed', error: 'Missing tutor or student email' },
        { status: 422 }
      );
    }

    try {
      const result = await createSessionCalendarEvent({
        bookingId,
        subject: booking.subject,
        start: booking.date.toDate(),
        durationMinutes: booking.durationMinutes,
        notes: booking.notes,
        tutorEmail,
        studentEmail,
        tutorName,
        studentName,
      });

      if (!result) {
        await bookingRef.update({
          meetingLinkStatus: 'skipped',
          updatedAt: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ meetingLinkStatus: 'skipped' }, { status: 503 });
      }

      await bookingRef.update({
        meetingLink: result.meetingLink,
        calendarEventId: result.eventId,
        meetingLinkStatus: 'ready',
        meetingLinkError: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        meetingLink: result.meetingLink,
        meetingLinkStatus: 'ready',
        calendarEventId: result.eventId,
      });
    } catch (calendarError) {
      const message =
        calendarError instanceof Error ? calendarError.message : 'Unknown error';
      await bookingRef.update({
        meetingLinkStatus: 'failed',
        meetingLinkError: message,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ meetingLinkStatus: 'failed', error: message }, { status: 500 });
    }
  } catch (error) {
    console.error('[meeting-link API]', error);
    return NextResponse.json(
      {
        meetingLinkStatus: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
