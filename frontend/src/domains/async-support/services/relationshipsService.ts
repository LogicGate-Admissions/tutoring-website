/**
 * File purpose:
 * Firestore service functions for student-tutor support relationships.
 *
 * A relationship is the shared space between one student and one tutor.
 * Later, messages, flagged questions, and shared resources will all belong
 * to one relationship.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import type {
  RelationshipSupportSummary,
  StudentTutorRelationship,
  StudentTutorRelationshipStatus,
} from '@/domains/async-support/types/asyncSupport';

const RELATIONSHIPS_COLLECTION = 'studentTutorRelationships';

/**
 * Data needed to create a relationship.
 *
 * This will usually be created after a tutor accepts a trial request, or when
 * we seed/test active student-tutor relationships during development.
 */
export type CreateStudentTutorRelationshipInput = {
  studentId: string;
  tutorId: string;

  studentName: string;
  tutorName: string;

  subject: string;
  level: string;
};


/**
 * Creates a predictable relationship id from student/tutor/subject.
 *
 * This prevents accidental duplicate relationships for the same pair and
 * subject if the same operation runs twice.
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

/**
 * Creates or overwrites a student-tutor relationship.
 *
 * We use setDoc because the relationship id is deterministic.
 */
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
    subject: input.subject,
    level: input.level,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  const relationshipRef = doc(db, RELATIONSHIPS_COLLECTION, relationshipId);

  const documentData = {
    studentId: relationship.studentId,
    tutorId: relationship.tutorId,
    studentName: relationship.studentName,
    tutorName: relationship.tutorName,
    subject: relationship.subject,
    level: relationship.level,
    status: relationship.status,
    createdAt: relationship.createdAt,
    updatedAt: relationship.updatedAt,
  };

  await setDoc(relationshipRef, documentData);

  return relationship;
}

/**
 * Reads one relationship by id.
 */
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

/**
 * Gets active relationships for a tutor.
 *
 * This is what the tutor dashboard variants will use later:
 * - Version A shows these as "My students".
 * - Version B shows these under Messages/Resources/Flagged questions.
 */
export async function getTutorRelationships(
  tutorId: string
): Promise<RelationshipSupportSummary[]> {
  const relationshipsQuery = query(
    collection(db, RELATIONSHIPS_COLLECTION),
    where('tutorId', '==', tutorId),
    where('status', '==', 'active'),
    orderBy('updatedAt', 'desc'),
    limit(50)
  );

  const snapshot = await getDocs(relationshipsQuery);

  return snapshot.docs.map((relationshipDoc) =>
    toRelationshipSupportSummary(
      mapRelationshipSnapshot(relationshipDoc.id, relationshipDoc.data())
    )
  );
}

/**
 * Gets active relationships for a student.
 *
 * This is what the student dashboard variants will use later:
 * - Version A shows these as "My tutors".
 * - Version B shows these under Messages/Resources/Flagged questions.
 */
export async function getStudentRelationships(
  studentId: string
): Promise<RelationshipSupportSummary[]> {
  const relationshipsQuery = query(
    collection(db, RELATIONSHIPS_COLLECTION),
    where('studentId', '==', studentId),
    where('status', '==', 'active'),
    orderBy('updatedAt', 'desc'),
    limit(50)
  );

  const snapshot = await getDocs(relationshipsQuery);

  return snapshot.docs.map((relationshipDoc) =>
    toRelationshipSupportSummary(
      mapRelationshipSnapshot(relationshipDoc.id, relationshipDoc.data())
    )
  );
}

/**
 * Updates the relationship status.
 *
 * Useful later if a tutoring relationship ends.
 */
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

/**
 * Converts Firestore data into the app relationship type.
 */
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
    subject: String(data.subject ?? ''),
    level: String(data.level ?? ''),
    status: normaliseRelationshipStatus(data.status),
    createdAt: String(data.createdAt ?? ''),
    updatedAt: String(data.updatedAt ?? ''),
  };
}

/**
 * Converts a relationship into a dashboard-friendly summary.
 *
 * For now, counts are placeholder zeroes. Later, when we add messages,
 * questions, and resources, this can be expanded to include real counts.
 */
function toRelationshipSupportSummary(
  relationship: StudentTutorRelationship
): RelationshipSupportSummary {
  return {
    ...relationship,
    unreadMessageCount: 0,
    openQuestionCount: 0,
    resourceCount: 0,
  };
}

/**
 * Safely converts unknown Firestore status values into known app statuses.
 */
function normaliseRelationshipStatus(
  status: unknown
): StudentTutorRelationshipStatus {
  if (status === 'ended') {
    return 'ended';
  }

  return 'active';
}