/**
 * File purpose: Booking domain types and typed errors.
 *
 * All Firestore document shapes, status unions, and input types for the
 * booking lifecycle live here. The service and hook files cast raw Firestore
 * data through these types — no component should import firebase/firestore.
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * All reachable states for a booking document.
 *
 * State machine:
 *   creation → pending_receiver
 *   pending_receiver + receiver accepts → pending_requester
 *   pending_requester + requester confirms → confirmed
 *   any non-terminal + decline (receiver) → declined
 *   any non-terminal + cancel (either) → cancelled
 *   confirmed + cancel (either) → cancelled
 */
export type BookingStatus =
  | 'pending_receiver'   // submitted, awaiting other party
  | 'pending_requester'  // receiver accepted, awaiting requester confirmation
  | 'confirmed'          // both accepted
  | 'cancelled'          // either party cancelled
  | 'declined';          // receiver declined

/** Persisted Firestore document for a booking request. */
export type BookingRequest = {
  id: string;
  tutorId: string;
  studentId: string;
  initiatedBy: 'tutor' | 'student';
  subject: string;                    // must be from tutor's listed subjects
  date: Timestamp;                    // session start date + time
  durationMinutes: number;
  notes?: string;
  status: BookingStatus;
  tutorAccepted: boolean;
  studentAccepted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  confirmedAt?: Timestamp;
  /** Google Meet join URL — set by Cloud Function when the session is confirmed. */
  meetingLink?: string;
  /** Google Calendar event ID — used to cancel/update the event server-side. */
  calendarEventId?: string;
  /**
   * Meet link provisioning state.
   *   pending — confirmed, Cloud Function is creating the calendar event
   *   ready   — meetingLink is available
   *   failed  — creation failed (see meetingLinkError in Firestore)
   *   skipped — Google Calendar API not configured
   */
  meetingLinkStatus?: 'pending' | 'ready' | 'failed' | 'skipped';
  // FUTURE: paymentStatus, paymentIntentId
};

/** Input required to create a new booking request. */
export type CreateBookingInput = {
  tutorId: string;
  studentId: string;
  initiatedBy: 'tutor' | 'student';
  subject: string;
  /** JavaScript Date representing the session start date and time. */
  date: Date;
  durationMinutes: number;
  notes?: string;
};

/**
 * Thrown when `acceptBookingRequest` detects an overlapping confirmed session
 * for the same tutor in the same time window.
 */
export class BookingConflictError extends Error {
  constructor(message = 'A confirmed booking already exists for this slot.') {
    super(message);
    this.name = 'BookingConflictError';
  }
}

/**
 * Thrown by `createBookingRequest` when the requested date/time falls outside
 * the tutor's stated availability blocks.
 */
export class SlotUnavailableError extends Error {
  constructor(
    message = "The requested slot falls outside the tutor's availability."
  ) {
    super(message);
    this.name = 'SlotUnavailableError';
  }
}
