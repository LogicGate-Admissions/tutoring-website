/**
 * File purpose: Cloud Function triggered on every bookingRequests document write.
 *
 * On status → confirmed: creates a Google Calendar event with a Meet link and
 * writes meetingLink back to the booking document before sending emails.
 *
 * On status → cancelled: deletes the associated calendar event if one exists.
 *
 * Deploy: firebase deploy --only functions:onBookingWrite
 *
 * CONFIG — email:
 *   RESEND_API_KEY
 *
 * CONFIG — Google Calendar (see googleCalendarService.ts for full setup):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 *   — or —
 *   GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_CALENDAR_IMPERSONATE_EMAIL
 */

import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';
import { sendBookingNotificationEmail } from '../services/emailNotificationService';
import {
  createSessionCalendarEvent,
  deleteSessionCalendarEvent,
  isCalendarConfigured,
} from '../services/googleCalendarService';

const FIRESTORE_COLLECTIONS = {
  bookingRequests: 'bookingRequests',
  users: 'users',
} as const;

initializeApp();
const db = getFirestore();

type BookingSnapshot = {
  tutorId: string;
  studentId: string;
  initiatedBy?: 'tutor' | 'student';
  subject: string;
  date: FirebaseFirestore.Timestamp;
  durationMinutes: number;
  notes?: string;
  status: string;
  tutorAccepted: boolean;
  studentAccepted: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  confirmedAt?: FirebaseFirestore.Timestamp;
  cancelledByRole?: 'tutor' | 'student';
  rescheduledByRole?: 'tutor' | 'student';
  meetingLink?: string;
  calendarEventId?: string;
  meetingLinkStatus?: string;
};

async function getUserEmail(uid: string): Promise<string | null> {
  const snap = await db.collection(FIRESTORE_COLLECTIONS.users).doc(uid).get();
  if (!snap.exists) return null;
  return (snap.data()?.email as string) ?? null;
}

async function getUserName(uid: string): Promise<string | undefined> {
  const snap = await db.collection(FIRESTORE_COLLECTIONS.users).doc(uid).get();
  if (!snap.exists) return undefined;
  return (snap.data()?.name as string) ?? undefined;
}

async function provisionMeetingLink(
  bookingId: string,
  data: BookingSnapshot
): Promise<BookingSnapshot> {
  if (data.meetingLink && data.calendarEventId) return data;

  const bookingRef = db.collection(FIRESTORE_COLLECTIONS.bookingRequests).doc(bookingId);

  if (!isCalendarConfigured()) {
    await bookingRef.update({
      meetingLinkStatus: 'skipped',
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ...data, meetingLinkStatus: 'skipped' };
  }

  await bookingRef.update({
    meetingLinkStatus: 'pending',
    updatedAt: FieldValue.serverTimestamp(),
  });

  try {
    const [tutorEmail, studentEmail, tutorName, studentName] = await Promise.all([
      getUserEmail(data.tutorId),
      getUserEmail(data.studentId),
      getUserName(data.tutorId),
      getUserName(data.studentId),
    ]);

    if (!tutorEmail || !studentEmail) {
      throw new Error('Missing tutor or student email — cannot create calendar invite.');
    }

    const result = await createSessionCalendarEvent({
      bookingId,
      subject: data.subject,
      start: data.date.toDate(),
      durationMinutes: data.durationMinutes,
      notes: data.notes,
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
      return { ...data, meetingLinkStatus: 'skipped' };
    }

    await bookingRef.update({
      meetingLink: result.meetingLink,
      calendarEventId: result.eventId,
      meetingLinkStatus: 'ready',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      ...data,
      meetingLink: result.meetingLink,
      calendarEventId: result.eventId,
      meetingLinkStatus: 'ready',
    };
  } catch (error) {
    console.error(`[onBookingWrite] Meet link creation failed for ${bookingId}:`, error);
    await bookingRef.update({
      meetingLinkStatus: 'failed',
      meetingLinkError: error instanceof Error ? error.message : 'Unknown error',
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ...data, meetingLinkStatus: 'failed' };
  }
}

async function removeMeetingLink(bookingId: string, data: BookingSnapshot): Promise<void> {
  if (!data.calendarEventId) return;

  await deleteSessionCalendarEvent(data.calendarEventId);

  await db.collection(FIRESTORE_COLLECTIONS.bookingRequests).doc(bookingId).update({
    meetingLink: FieldValue.delete(),
    calendarEventId: FieldValue.delete(),
    meetingLinkStatus: FieldValue.delete(),
    meetingLinkError: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export const onBookingWrite = onDocumentWritten(
  `${FIRESTORE_COLLECTIONS.bookingRequests}/{bookingId}`,
  async (event) => {
    const beforeData = event.data?.before?.data() as BookingSnapshot | undefined;
    const afterData = event.data?.after?.data() as BookingSnapshot | undefined;
    const bookingId = event.params.bookingId;

    if (!afterData) return;

    const beforeStatus = beforeData?.status;
    const afterStatus = afterData.status;

    const beforeDateMs = beforeData?.date?.toMillis?.() ?? 0;
    const afterDateMs = afterData.date?.toMillis?.() ?? 0;
    const dateChanged = beforeData !== undefined && beforeDateMs !== afterDateMs;

    let bookingForEmail: BookingSnapshot & { id: string } = {
      id: bookingId,
      ...afterData,
    };

    // ── Calendar: create Meet link on confirmation ──────────────────────────
    if (afterStatus === 'confirmed' && beforeStatus !== 'confirmed') {
      bookingForEmail = {
        ...(await provisionMeetingLink(bookingId, afterData)),
        id: bookingId,
      };
    }

    // ── Calendar: remove event on cancellation ────────────────────────────────
    if (afterStatus === 'cancelled' && beforeStatus !== 'cancelled' && afterData.calendarEventId) {
      await removeMeetingLink(bookingId, afterData);
    }

    if (beforeStatus === afterStatus && beforeData !== undefined && !dateChanged) return;

    type Notification = { userId: string; eventType: string };
    const notifications: Notification[] = [];

    if (!beforeData) {
      const receiverId =
        afterData.initiatedBy === 'student' ? afterData.tutorId : afterData.studentId;
      notifications.push({ userId: receiverId, eventType: 'booking_request' });
    } else if (afterStatus === 'confirmed') {
      if (!beforeData.tutorAccepted && afterData.tutorAccepted) {
        notifications.push({ userId: afterData.studentId, eventType: 'booking_accepted' });
      } else {
        notifications.push({ userId: afterData.tutorId, eventType: 'booking_accepted' });
      }
    } else if (afterStatus === 'declined') {
      const requesterId =
        afterData.initiatedBy === 'student' ? afterData.studentId : afterData.tutorId;
      notifications.push({ userId: requesterId, eventType: 'booking_declined' });
    } else if (afterStatus === 'cancelled') {
      const cancelledBy = afterData.cancelledByRole;
      const otherUserId =
        cancelledBy === 'tutor'
          ? afterData.studentId
          : cancelledBy === 'student'
            ? afterData.tutorId
            : null;
      if (otherUserId) {
        notifications.push({ userId: otherUserId, eventType: 'booking_cancelled' });
      }
    } else if (dateChanged && afterData.rescheduledByRole) {
      const rescheduledBy = afterData.rescheduledByRole;
      const otherUserId =
        rescheduledBy === 'tutor' ? afterData.studentId : afterData.tutorId;
      notifications.push({ userId: otherUserId, eventType: 'booking_rescheduled' });
    } else if (afterStatus === 'pending_requester') {
      const requesterId =
        afterData.tutorAccepted && !afterData.studentAccepted
          ? afterData.studentId
          : afterData.tutorId;
      notifications.push({ userId: requesterId, eventType: 'booking_accepted' });
    }

    await Promise.allSettled(
      notifications.map(async ({ userId, eventType }) => {
        const email = await getUserEmail(userId);
        if (!email) return;
        await sendBookingNotificationEmail(bookingForEmail, email, eventType);
      })
    );
  }
);
