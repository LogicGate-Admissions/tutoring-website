"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.onBookingWrite = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const emailNotificationService_1 = require("../services/emailNotificationService");
const googleCalendarService_1 = require("../services/googleCalendarService");
const FIRESTORE_COLLECTIONS = {
    bookingRequests: 'bookingRequests',
    users: 'users',
};
(0, app_1.initializeApp)();
const db = (0, firestore_2.getFirestore)();
async function getUserEmail(uid) {
    const snap = await db.collection(FIRESTORE_COLLECTIONS.users).doc(uid).get();
    if (!snap.exists)
        return null;
    return snap.data()?.email ?? null;
}
async function getUserName(uid) {
    const snap = await db.collection(FIRESTORE_COLLECTIONS.users).doc(uid).get();
    if (!snap.exists)
        return undefined;
    return snap.data()?.name ?? undefined;
}
async function provisionMeetingLink(bookingId, data) {
    if (data.meetingLink && data.calendarEventId)
        return data;
    const bookingRef = db.collection(FIRESTORE_COLLECTIONS.bookingRequests).doc(bookingId);
    if (!(0, googleCalendarService_1.isCalendarConfigured)()) {
        await bookingRef.update({
            meetingLinkStatus: 'skipped',
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        });
        return { ...data, meetingLinkStatus: 'skipped' };
    }
    await bookingRef.update({
        meetingLinkStatus: 'pending',
        updatedAt: firestore_2.FieldValue.serverTimestamp(),
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
        const result = await (0, googleCalendarService_1.createSessionCalendarEvent)({
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
                updatedAt: firestore_2.FieldValue.serverTimestamp(),
            });
            return { ...data, meetingLinkStatus: 'skipped' };
        }
        await bookingRef.update({
            meetingLink: result.meetingLink,
            calendarEventId: result.eventId,
            meetingLinkStatus: 'ready',
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        });
        return {
            ...data,
            meetingLink: result.meetingLink,
            calendarEventId: result.eventId,
            meetingLinkStatus: 'ready',
        };
    }
    catch (error) {
        console.error(`[onBookingWrite] Meet link creation failed for ${bookingId}:`, error);
        await bookingRef.update({
            meetingLinkStatus: 'failed',
            meetingLinkError: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        });
        return { ...data, meetingLinkStatus: 'failed' };
    }
}
async function removeMeetingLink(bookingId, data) {
    if (!data.calendarEventId)
        return;
    await (0, googleCalendarService_1.deleteSessionCalendarEvent)(data.calendarEventId);
    await db.collection(FIRESTORE_COLLECTIONS.bookingRequests).doc(bookingId).update({
        meetingLink: firestore_2.FieldValue.delete(),
        calendarEventId: firestore_2.FieldValue.delete(),
        meetingLinkStatus: firestore_2.FieldValue.delete(),
        meetingLinkError: firestore_2.FieldValue.delete(),
        updatedAt: firestore_2.FieldValue.serverTimestamp(),
    });
}
exports.onBookingWrite = (0, firestore_1.onDocumentWritten)(`${FIRESTORE_COLLECTIONS.bookingRequests}/{bookingId}`, async (event) => {
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();
    const bookingId = event.params.bookingId;
    if (!afterData)
        return;
    const beforeStatus = beforeData?.status;
    const afterStatus = afterData.status;
    let bookingForEmail = {
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
    if (beforeStatus === afterStatus && beforeData !== undefined)
        return;
    const notifications = [];
    if (!beforeData) {
        const receiverId = afterData.initiatedBy === 'student' ? afterData.tutorId : afterData.studentId;
        notifications.push({ userId: receiverId, eventType: 'booking_request' });
    }
    else if (afterStatus === 'confirmed') {
        if (!beforeData.tutorAccepted && afterData.tutorAccepted) {
            notifications.push({ userId: afterData.studentId, eventType: 'booking_accepted' });
        }
        else {
            notifications.push({ userId: afterData.tutorId, eventType: 'booking_accepted' });
        }
    }
    else if (afterStatus === 'declined') {
        const requesterId = afterData.initiatedBy === 'student' ? afterData.studentId : afterData.tutorId;
        notifications.push({ userId: requesterId, eventType: 'booking_declined' });
    }
    else if (afterStatus === 'cancelled') {
        notifications.push({ userId: afterData.tutorId, eventType: 'booking_cancelled' });
        notifications.push({ userId: afterData.studentId, eventType: 'booking_cancelled' });
    }
    else if (afterStatus === 'pending_requester') {
        const requesterId = afterData.tutorAccepted && !afterData.studentAccepted
            ? afterData.studentId
            : afterData.tutorId;
        notifications.push({ userId: requesterId, eventType: 'booking_accepted' });
    }
    await Promise.allSettled(notifications.map(async ({ userId, eventType }) => {
        const email = await getUserEmail(userId);
        if (!email)
            return;
        await (0, emailNotificationService_1.sendBookingNotificationEmail)(bookingForEmail, email, eventType);
    }));
});
//# sourceMappingURL=onBookingWrite.js.map