/**
 * File purpose:
 * Firestore service functions for student-tutor support relationships.
 *
 * Relationship documents are the source of truth for dashboard relationship
 * lists and lightweight activity summaries. Message documents still live in the
 * messages subcollection, but the latest message metadata is copied onto the
 * relationship so dashboards and notifications can load quickly.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/shared/constants/firestoreCollections';
import type {
  AsyncSupportRole,
  RelationshipSupportSummary,
  StudentTutorRelationship,
  StudentTutorRelationshipStatus,
} from '@/domains/async-support/types/asyncSupport';

const RELATIONSHIPS_COLLECTION = 'studentTutorRelationships';

/** Data needed to create a relationship. */
export type CreateStudentTutorRelationshipInput = {
  studentId: string;
  tutorId: string;

  studentName: string;
  tutorName: string;
  studentEmail?: string;
  tutorEmail?: string;

  subject: string;
  level: string;
};

/** Data needed to mark a user's message thread as seen. */
type MarkMessagesSeenInput = {
  relationshipId: string;
  viewerRole: AsyncSupportRole;
};

/**
 * Creates a predictable relationship id from student/tutor/subject.
 *
 * This prevents duplicate relationships for the same pair and subject if the
 * same operation runs twice, for example if a tutor accepts a trial twice.
 */
export function buildRelationshipId({
  studentId,
  tutorId,
  subject,
}: {
  studentId: string;
  tutorId: string;
  subject: string;
}) {
  const safeSubject = subject
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return `${studentId}_${tutorId}_${safeSubject || 'general'}`;
}

/** Creates or overwrites a student-tutor relationship. */
export async function createStudentTutorRelationship(
  input: CreateStudentTutorRelationshipInput
): Promise<StudentTutorRelationship> {
  const now = new Date().toISOString();
  const relationshipId = buildRelationshipId({
    studentId: input.studentId,
    tutorId: input.tutorId,
    subject: input.subject,
  });

  const relationship: StudentTutorRelationship = {
    id: relationshipId,
    studentId: input.studentId,
    tutorId: input.tutorId,
    studentName: input.studentName,
    tutorName: input.tutorName,
    studentEmail: input.studentEmail,
    tutorEmail: input.tutorEmail,
    subject: input.subject,
    level: input.level,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    studentLastSeenMessagesAt: now,
    tutorLastSeenMessagesAt: now,
  };

  const relationshipRef = doc(db, RELATIONSHIPS_COLLECTION, relationshipId);

  const documentData = {
    studentId: relationship.studentId,
    tutorId: relationship.tutorId,
    studentName: relationship.studentName,
    tutorName: relationship.tutorName,
    ...(relationship.studentEmail ? { studentEmail: relationship.studentEmail } : {}),
    ...(relationship.tutorEmail ? { tutorEmail: relationship.tutorEmail } : {}),
    subject: relationship.subject,
    level: relationship.level,
    status: relationship.status,
    createdAt: relationship.createdAt,
    updatedAt: relationship.updatedAt,
    studentLastSeenMessagesAt: relationship.studentLastSeenMessagesAt,
    tutorLastSeenMessagesAt: relationship.tutorLastSeenMessagesAt,
  };

  await setDoc(relationshipRef, documentData);

  const linkRef = doc(
    db,
    FIRESTORE_COLLECTIONS.tutorStudentLinks,
    `${input.tutorId}_${input.studentId}`
  );
  await setDoc(linkRef, { tutorId: input.tutorId, studentId: input.studentId }, { merge: true });

  return relationship;
}

/** Reads one relationship by id. */
export async function getStudentTutorRelationshipById(
  relationshipId: string
): Promise<StudentTutorRelationship | null> {
  const relationshipRef = doc(db, RELATIONSHIPS_COLLECTION, relationshipId);
  const snapshot = await getDoc(relationshipRef);

  if (!snapshot.exists()) {
    return null;
  }

  return mapRelationshipSnapshot(snapshot.id, snapshot.data());
}

/** Gets active relationships for a tutor. */
export async function getTutorRelationships(
  tutorId: string
): Promise<RelationshipSupportSummary[]> {
  const snapshot = await getDocs(buildRelationshipsQuery('tutor', tutorId));

  return snapshot.docs.map((relationshipDoc) =>
    toRelationshipSupportSummary(
      mapRelationshipSnapshot(relationshipDoc.id, relationshipDoc.data()),
      tutorId,
      'tutor'
    )
  );
}

/** Gets active relationships for a student. */
export async function getStudentRelationships(
  studentId: string
): Promise<RelationshipSupportSummary[]> {
  const snapshot = await getDocs(buildRelationshipsQuery('student', studentId));

  return snapshot.docs.map((relationshipDoc) =>
    toRelationshipSupportSummary(
      mapRelationshipSnapshot(relationshipDoc.id, relationshipDoc.data()),
      studentId,
      'student'
    )
  );
}

/**
 * Subscribes to active relationships for a student or tutor.
 *
 * The notification bell uses this so it can update as soon as a message writes
 * latest-message metadata onto the relationship document.
 */
export function subscribeToRelationshipSummaries({
  viewerId,
  viewerRole,
  onChange,
  onError,
}: {
  viewerId: string;
  viewerRole: AsyncSupportRole;
  onChange: (relationships: RelationshipSupportSummary[]) => void;
  onError?: (error: Error) => void;
}) {
  return onSnapshot(
    buildRelationshipsQuery(viewerRole, viewerId),
    (snapshot) => {
      onChange(
        snapshot.docs.map((relationshipDoc) =>
          toRelationshipSupportSummary(
            mapRelationshipSnapshot(relationshipDoc.id, relationshipDoc.data()),
            viewerId,
            viewerRole
          )
        )
      );
    },
    (error) => {
      onError?.(error);
    }
  );
}

/** Updates the relationship status. */
export async function updateStudentTutorRelationshipStatus({
  relationshipId,
  status,
}: {
  relationshipId: string;
  status: StudentTutorRelationshipStatus;
}) {
  const relationshipRef = doc(db, RELATIONSHIPS_COLLECTION, relationshipId);

  await updateDoc(relationshipRef, {
    status,
    updatedAt: new Date().toISOString(),
  });
}

/** Marks messages as seen for the current viewer. */
export async function markRelationshipMessagesSeen({
  relationshipId,
  viewerRole,
}: MarkMessagesSeenInput) {
  const relationshipRef = doc(db, RELATIONSHIPS_COLLECTION, relationshipId);
  const seenField =
    viewerRole === 'student'
      ? 'studentLastSeenMessagesAt'
      : 'tutorLastSeenMessagesAt';

  await updateDoc(relationshipRef, {
    [seenField]: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/** Builds the active relationship query for a role. */
function buildRelationshipsQuery(viewerRole: AsyncSupportRole, viewerId: string) {
  const idField = viewerRole === 'student' ? 'studentId' : 'tutorId';

  return query(
    collection(db, RELATIONSHIPS_COLLECTION),
    where(idField, '==', viewerId),
    where('status', '==', 'active'),
    orderBy('updatedAt', 'desc'),
    limit(50)
  );
}

/** Converts Firestore data into the app relationship type. */
function mapRelationshipSnapshot(
  id: string,
  data: Record<string, unknown>
): StudentTutorRelationship {
  return {
    id,
    studentId: String(data.studentId ?? ''),
    tutorId: String(data.tutorId ?? ''),
    studentName: String(data.studentName ?? ''),
    tutorName: String(data.tutorName ?? ''),
    studentEmail: optionalString(data.studentEmail),
    tutorEmail: optionalString(data.tutorEmail),
    subject: String(data.subject ?? ''),
    level: String(data.level ?? ''),
    status: normaliseRelationshipStatus(data.status),
    createdAt: String(data.createdAt ?? ''),
    updatedAt: String(data.updatedAt ?? ''),
    latestMessagePreview: optionalString(data.latestMessagePreview),
    latestMessageAt: optionalString(data.latestMessageAt),
    latestMessageSenderId: optionalString(data.latestMessageSenderId),
    latestMessageSenderName: optionalString(data.latestMessageSenderName),
    latestMessageSenderRole: normaliseOptionalRole(data.latestMessageSenderRole),
    latestMessageUrgency: normaliseMessageUrgency(data.latestMessageUrgency),
    studentLastSeenMessagesAt: optionalString(data.studentLastSeenMessagesAt),
    tutorLastSeenMessagesAt: optionalString(data.tutorLastSeenMessagesAt),
  };
}

/** Converts a relationship into a dashboard-friendly summary. */
function toRelationshipSupportSummary(
  relationship: StudentTutorRelationship,
  viewerId: string,
  viewerRole: AsyncSupportRole
): RelationshipSupportSummary {
  const viewerLastSeenMessagesAt =
    viewerRole === 'student'
      ? relationship.studentLastSeenMessagesAt
      : relationship.tutorLastSeenMessagesAt;

  const hasUnreadMessageActivity = hasUnreadLatestMessage({
    latestMessageAt: relationship.latestMessageAt,
    latestMessageSenderId: relationship.latestMessageSenderId,
    viewerId,
    viewerLastSeenMessagesAt,
  });

  return {
    ...relationship,
    unreadMessageCount: hasUnreadMessageActivity ? 1 : 0,
    hasUnreadMessageActivity,
    openQuestionCount: 0,
    resourceCount: 0,
  };
}

/** Returns true when the latest message came from the other person after last seen. */
function hasUnreadLatestMessage({
  latestMessageAt,
  latestMessageSenderId,
  viewerId,
  viewerLastSeenMessagesAt,
}: {
  latestMessageAt?: string;
  latestMessageSenderId?: string;
  viewerId: string;
  viewerLastSeenMessagesAt?: string;
}) {
  if (!latestMessageAt || !latestMessageSenderId) {
    return false;
  }

  if (latestMessageSenderId === viewerId) {
    return false;
  }

  if (!viewerLastSeenMessagesAt) {
    return true;
  }

  return latestMessageAt > viewerLastSeenMessagesAt;
}

/** Safely converts unknown Firestore status values into known app statuses. */
function normaliseRelationshipStatus(
  status: unknown
): StudentTutorRelationshipStatus {
  if (status === 'ended') {
    return 'ended';
  }

  return 'active';
}

/** Safely converts unknown Firestore role values into optional app roles. */
function normaliseOptionalRole(role: unknown): AsyncSupportRole | undefined {
  if (role === 'student' || role === 'tutor') {
    return role;
  }

  return undefined;
}

function normaliseMessageUrgency(value: unknown) {
  return value === 'urgent' ? 'urgent' : undefined;
}

function optionalString(value: unknown) {
  const stringValue = String(value ?? '');
  return stringValue || undefined;
}
