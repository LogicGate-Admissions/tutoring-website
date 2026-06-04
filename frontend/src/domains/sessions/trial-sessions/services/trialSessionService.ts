/**
 * File purpose: Firestore persistence boundary for trial-session requests.
 */

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { createStudentTutorRelationship } from '@/domains/async-support/services/relationshipsService';
import { getCurrentFirebaseUser } from '@/domains/auth/services/authService';
import { db } from '@/shared/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/shared/constants/firestoreCollections';
import type {
  CreateTrialSessionRequestInput,
  TrialSessionRequest,
  TrialSessionStatus,
} from '@/domains/sessions/trial-sessions/types/trialSession';

function mapTrialSessionDocument(document: { id: string; data: () => unknown }) {
  return {
    id: document.id,
    ...(document.data() as Omit<TrialSessionRequest, 'id'>),
  } satisfies TrialSessionRequest;
}

/**
 * Creates a pending trial session request in Firestore.
 */
export async function createTrialSessionRequest(
  input: CreateTrialSessionRequestInput
) {
  await addDoc(collection(db, FIRESTORE_COLLECTIONS.trialSessionRequests), {
    ...input,
    status: 'pending',
    createdAt: serverTimestamp(),
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
 * student and tutor get the shared message/resource/question space.
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
  });

  await updateTrialSessionStatus(request.id, 'accepted');
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
