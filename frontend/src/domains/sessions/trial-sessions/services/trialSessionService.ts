/**
 * File purpose: Firestore persistence boundary for trial-session requests.
 */

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { createStudentTutorRelationship } from '@/domains/async-support/services/relationshipsService';
import { getCurrentFirebaseUser } from '@/domains/auth/services/authService';
import { db } from '@/shared/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/shared/constants/firestoreCollections';
import type {
  CreateTrialSessionRequestInput,
  PreBookingMessage,
  TrialSessionRequest,
  TrialSessionStatus,
} from '@/domains/sessions/trial-sessions/types/trialSession';

type AddPreBookingMessageInput = {
  requestId: string;
  senderId: string;
  senderRole: 'student' | 'tutor';
  senderName: string;
  body: string;
};

function mapTrialSessionDocument(document: { id: string; data: () => unknown }) {
  const data = document.data() as Omit<TrialSessionRequest, 'id'>;

  return {
    id: document.id,
    ...data,
    preBookingMessages: normalisePreBookingMessages(data.preBookingMessages),
  } satisfies TrialSessionRequest;
}

export async function ensureTutorStudentLink({
  tutorId,
  studentId,
  source = 'pendingRequest',
}: {
  tutorId: string;
  studentId: string;
  source?: 'pendingRequest' | 'acceptedRelationship' | 'profilePreview';
}) {
  await setDoc(
    doc(db, FIRESTORE_COLLECTIONS.tutorStudentLinks, `${tutorId}_${studentId}`),
    {
      tutorId,
      studentId,
      source,
      createdAt: serverTimestamp(),
    }
  );
}

/**
 * Creates a pending trial session request in Firestore.
 */
export async function createTrialSessionRequest(
  input: CreateTrialSessionRequestInput
) {
  const requestRef = await addDoc(
    collection(db, FIRESTORE_COLLECTIONS.trialSessionRequests),
    {
      ...input,
      preBookingMessages: normalisePreBookingMessages(input.preBookingMessages),
      status: 'pending',
      createdAt: serverTimestamp(),
    }
  );

  await ensureTutorStudentLink({
    tutorId: input.tutorId,
    studentId: input.studentId,
    source: 'pendingRequest',
  });

  return requestRef.id;
}


/** Removes a pending pre-booking request created before a relationship exists. */
export async function cancelTrialSessionRequest(requestId: string) {
  await deleteDoc(
    doc(db, FIRESTORE_COLLECTIONS.trialSessionRequests, requestId)
  );
}


/** Withdraws the explicit match request but keeps the pre-booking conversation. */
export async function withdrawMatchRequestFromPreBookingConversation({
  requestId,
  remainingMessages,
}: {
  requestId: string;
  remainingMessages: PreBookingMessage[];
}) {
  const requestRef = doc(
    db,
    FIRESTORE_COLLECTIONS.trialSessionRequests,
    requestId
  );
  const latestMessage = remainingMessages[remainingMessages.length - 1];

  await updateDoc(requestRef, {
    preBookingMessages: remainingMessages,
    pendingReasons: arrayRemove('requested'),
    message: latestMessage?.body ?? '',
    updatedAt: serverTimestamp(),
  });
}

/** Adds an explicit match request onto an existing pre-booking conversation. */
export async function addMatchRequestToPreBookingConversation({
  requestId,
  senderId,
  senderName,
  body,
}: {
  requestId: string;
  senderId: string;
  senderName: string;
  body: string;
}) {
  const trimmedBody = body.trim();

  if (!trimmedBody) {
    return;
  }

  const message: PreBookingMessage = {
    id: crypto.randomUUID(),
    senderId,
    senderRole: 'student',
    senderName,
    body: trimmedBody,
    createdAt: new Date().toISOString(),
  };

  const requestRef = doc(
    db,
    FIRESTORE_COLLECTIONS.trialSessionRequests,
    requestId
  );

  await updateDoc(requestRef, {
    preBookingMessages: arrayUnion(message),
    pendingReasons: arrayUnion('requested'),
    message: trimmedBody,
    updatedAt: serverTimestamp(),
  });
}

/** Adds a text-only clarifying message to a pending match request. */
export async function addPreBookingMessage(input: AddPreBookingMessageInput) {
  const trimmedBody = input.body.trim();

  if (!trimmedBody) {
    return;
  }

  const message: PreBookingMessage = {
    id: crypto.randomUUID(),
    senderId: input.senderId,
    senderRole: input.senderRole,
    senderName: input.senderName,
    body: trimmedBody,
    createdAt: new Date().toISOString(),
  };

  const requestRef = doc(
    db,
    FIRESTORE_COLLECTIONS.trialSessionRequests,
    input.requestId
  );

  await updateDoc(requestRef, {
    preBookingMessages: arrayUnion(message),
    pendingReasons: arrayUnion('messaged'),
    message: trimmedBody,
    updatedAt: serverTimestamp(),
  });
}

/** Marks text-only pre-booking messages as seen for the current viewer. */
export async function markPreBookingMessagesSeen(
  requestId: string,
  viewerRole: 'student' | 'tutor'
) {
  const requestRef = doc(
    db,
    FIRESTORE_COLLECTIONS.trialSessionRequests,
    requestId
  );

  await updateDoc(requestRef, {
    [viewerRole === 'student'
      ? 'studentPreBookingSeenAt'
      : 'tutorPreBookingSeenAt']: serverTimestamp(),
  });
}

/**
 * Updates whether a tutor accepted or rejected a request.
 */
export async function updateTrialSessionStatus(
  requestId: string,
  status: TrialSessionStatus
) {
  const requestRef = doc(
    db,
    FIRESTORE_COLLECTIONS.trialSessionRequests,
    requestId
  );

  await updateDoc(requestRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Accepts a trial request and creates the relationship that powers async support.
 *
 * This keeps the dashboard flow automatic: once a tutor accepts, both the
 * student and tutor get the shared message/resource/question space. Any simple
 * pre-booking conversation is copied onto the relationship so the normal
 * message thread starts with that context.
 */
export async function acceptTrialSessionRequest(request: TrialSessionRequest) {
  await createStudentTutorRelationship({
    studentId: request.studentId,
    tutorId: request.tutorId,
    studentName: request.studentName,
    tutorName: request.tutorName,
    studentEmail: request.studentEmail,
    tutorEmail: getCurrentFirebaseUser()?.email ?? '',
    subject: request.subject,
    level: request.level,
    preBookingMessages: request.preBookingMessages ?? [],
  });

  await updateTrialSessionStatus(request.id, 'accepted');
}

/** Marks a tutor-facing pending request notification as seen. */
export async function markTrialSessionRequestSeen(requestId: string) {
  const requestRef = doc(
    db,
    FIRESTORE_COLLECTIONS.trialSessionRequests,
    requestId
  );

  await updateDoc(requestRef, {
    tutorRequestSeenAt: serverTimestamp(),
  });
}

/** Marks a student-facing trial status notification as seen. */
export async function markTrialSessionStatusSeen(requestId: string) {
  const requestRef = doc(
    db,
    FIRESTORE_COLLECTIONS.trialSessionRequests,
    requestId
  );

  await updateDoc(requestRef, {
    studentStatusSeenAt: serverTimestamp(),
  });
}

/**
 * Subscribes to trial requests for a specific tutor.
 *
 * This is used by the tutor dashboard so tutors see requests without manually
 * refreshing the page.
 */
export function subscribeToTutorTrialSessions(
  tutorId: string,
  onChange: (requests: TrialSessionRequest[]) => void
) {
  const tutorRequestsQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.trialSessionRequests),
    where('tutorId', '==', tutorId)
  );

  return onSnapshot(tutorRequestsQuery, (snapshot) => {
    onChange(snapshot.docs.map(mapTrialSessionDocument));
  });
}

/**
 * Subscribes to trial requests created by a specific student.
 *
 * This is what lets the student-facing tutor cards change from "Request match" to
 * "Request sent" and later show Accepted/Rejected.
 */
export function subscribeToStudentTrialSessions(
  studentId: string,
  onChange: (requests: TrialSessionRequest[]) => void
) {
  const studentRequestsQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.trialSessionRequests),
    where('studentId', '==', studentId)
  );

  return onSnapshot(studentRequestsQuery, (snapshot) => {
    onChange(snapshot.docs.map(mapTrialSessionDocument));
  });
}

function normalisePreBookingMessages(value: unknown): PreBookingMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      const data = item as Record<string, unknown>;
      const body = String(data.body ?? '').trim();

      if (!body) {
        return null;
      }

      return {
        id: String(data.id ?? `pre-booking-${index}`),
        senderId: String(data.senderId ?? ''),
        senderRole: data.senderRole === 'tutor' ? 'tutor' : 'student',
        senderName: String(data.senderName ?? 'Unknown user'),
        body,
        createdAt: String(data.createdAt ?? ''),
      } satisfies PreBookingMessage;
    })
    .filter((message): message is PreBookingMessage => Boolean(message))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
