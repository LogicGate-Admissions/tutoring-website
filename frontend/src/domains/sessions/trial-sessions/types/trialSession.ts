/**
 * File purpose: Application source file. Comments explain what this file owns and what should stay elsewhere.
 */

/**
 * Current lifecycle states for a trial session request.
 */
export type TrialSessionStatus = 'pending' | 'accepted' | 'rejected';
export type PendingTutorReason = 'messaged' | 'requested';

/** One subject/level pair selected when a student requests a match. */
export type RequestedTutoringSubject = {
  level: string;
  subject: string;
  label: string;
};

/**
 * Lightweight message used before a student/tutor relationship has been accepted.
 *
 * These messages are intentionally text-only: no maths keyboard, urgency flag,
 * or file uploads. Once a match is accepted, the transcript is copied onto the
 * relationship document so it appears at the top of the normal message thread.
 */
export type PreBookingMessage = {
  id: string;
  senderId: string;
  senderRole: 'student' | 'tutor';
  senderName: string;
  body: string;
  createdAt: string;
};

/**
 * Trial session request shared by student and tutor views.
 */
export type TrialSessionRequest = {
  id: string;
  tutorId: string;
  tutorName: string;
  tutorPhotoUrl?: string;
  studentId: string;
  studentName: string;
  studentPhotoUrl?: string;
  studentEmail?: string;
  subject: string;
  level: string;
  requestedSubjects?: RequestedTutoringSubject[];
  learningStyle: string;
  preferredTime: string;
  message: string;
  preBookingMessages?: PreBookingMessage[];
  pendingReasons?: PendingTutorReason[];
  messagingUnlocked?: boolean;
  status: TrialSessionStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
  studentStatusSeenAt?: unknown;
  studentPreBookingSeenAt?: unknown;
  tutorPreBookingSeenAt?: unknown;
  tutorRequestSeenAt?: unknown;
};

/**
 * Data needed before a request exists in Firestore.
 */
export type CreateTrialSessionRequestInput = Omit<
  TrialSessionRequest,
  'id' | 'status' | 'createdAt' | 'updatedAt' | 'studentStatusSeenAt'
>;
