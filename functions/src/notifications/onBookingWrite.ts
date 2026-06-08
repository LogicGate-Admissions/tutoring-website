/**
 * File purpose: Cloud Function triggered on every bookingRequests document write.
 *
 * Fires on create, update, and delete. Compares before/after status to determine
 * which notification email to send, then fetches recipient emails from the
 * `users` collection and calls the email service.
 *
 * Deploy with:  firebase deploy --only functions:onBookingWrite
 *
 * CONFIG: ensure RESEND_API_KEY is set in Firebase Functions config:
 *   firebase functions:config:set resend.api_key="re_xxxx"
 */

import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';
import { sendBookingNotificationEmail } from '../services/emailNotificationService';

// SCHEMA ASSUMPTION: users/{uid}.email holds the user's verified email address
const FIRESTORE_COLLECTIONS = {
  bookingRequests: 'bookingRequests',
  users: 'users',
} as const;

initializeApp();
const db = getFirestore();

type BookingStatusSnapshot = {
  tutorId: string;
  studentId: string;
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
};

async function getUserEmail(uid: string): Promise<string | null> {
  const snap = await db.collection(FIRESTORE_COLLECTIONS.users).doc(uid).get();
  if (!snap.exists) return null;
  return (snap.data()?.email as string) ?? null;
}

export const onBookingWrite = onDocumentWritten(
  `${FIRESTORE_COLLECTIONS.bookingRequests}/{bookingId}`,
  async (event) => {
    const beforeData = event.data?.before?.data() as BookingStatusSnapshot | undefined;
    const afterData = event.data?.after?.data() as BookingStatusSnapshot | undefined;
    const bookingId = event.params.bookingId;

    if (!afterData) return; // document deleted — no notification

    const beforeStatus = beforeData?.status;
    const afterStatus = afterData.status;

    const beforeDateMs = beforeData?.date?.toMillis?.() ?? 0;
    const afterDateMs = afterData.date?.toMillis?.() ?? 0;
    const dateChanged = beforeData !== undefined && beforeDateMs !== afterDateMs;

    if (beforeStatus === afterStatus && beforeData !== undefined && !dateChanged) {
      return;
    }

    // Build a plain BookingRequest-like object for the email service
    const booking = {
      id: bookingId,
      ...afterData,
    };

    type Notification = { userId: string; eventType: string };
    const notifications: Notification[] = [];

    if (!beforeData) {
      // Document created → notify receiver
      const receiverId =
        afterData.tutorId === afterData.studentId
          ? afterData.tutorId
          : afterData.tutorId; // default: receiver is tutor when student initiates
      notifications.push({ userId: receiverId, eventType: 'booking_request' });
    } else if (afterStatus === 'confirmed') {
      // Confirmed → notify the party whose flag just flipped
      if (!beforeData.tutorAccepted && afterData.tutorAccepted) {
        notifications.push({ userId: afterData.studentId, eventType: 'booking_accepted' });
      } else {
        notifications.push({ userId: afterData.tutorId, eventType: 'booking_accepted' });
      }
    } else if (afterStatus === 'declined') {
      // Declined → notify requester
      notifications.push({ userId: afterData.studentId, eventType: 'booking_declined' });
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
      // Receiver accepted — notify requester
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await sendBookingNotificationEmail(booking as any, email, eventType);
      })
    );
  }
);
