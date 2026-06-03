/**
 * File purpose:
 * Firestore service functions for async-support messages.
 *
 * Messages belong to one student-tutor relationship:
 * studentTutorRelationships/{relationshipId}/messages/{messageId}
 */

import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import type {
  AsyncSupportRole,
  SupportMessage,
} from '@/domains/async-support/types/asyncSupport';

const RELATIONSHIPS_COLLECTION = 'studentTutorRelationships';
const MESSAGES_SUBCOLLECTION = 'messages';

type CreateSupportMessageInput = {
  relationshipId: string;
  senderId: string;
  senderRole: AsyncSupportRole;
  senderName: string;
  body: string;
};

/**
 * Returns the Firestore collection reference for messages inside a relationship.
 */
function getMessagesCollection(relationshipId: string) {
  return collection(
    db,
    RELATIONSHIPS_COLLECTION,
    relationshipId,
    MESSAGES_SUBCOLLECTION
  );
}

/**
 * Loads all messages for one relationship, oldest first.
 */
export async function getSupportMessages(
  relationshipId: string
): Promise<SupportMessage[]> {
  const messagesQuery = query(
    getMessagesCollection(relationshipId),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(messagesQuery);

  return snapshot.docs.map((messageDoc) =>
    mapSupportMessageSnapshot(messageDoc.id, messageDoc.data())
  );
}

/**
 * Adds a new message to a relationship.
 */
export async function createSupportMessage(
  input: CreateSupportMessageInput
): Promise<SupportMessage> {
  const now = new Date().toISOString();

  const messageData = {
    relationshipId: input.relationshipId,
    senderId: input.senderId,
    senderRole: input.senderRole,
    senderName: input.senderName,
    body: input.body.trim(),
    createdAt: now,
    updatedAt: now,
  };

  const messageRef = await addDoc(
    getMessagesCollection(input.relationshipId),
    messageData
  );

  return {
    id: messageRef.id,
    ...messageData,
  };
}

/**
 * Converts Firestore message data into the app message type.
 */
function mapSupportMessageSnapshot(
  id: string,
  data: Record<string, unknown>
): SupportMessage {
  return {
    id,
    relationshipId: String(data.relationshipId ?? ''),
    senderId: String(data.senderId ?? ''),
    senderRole: normaliseSenderRole(data.senderRole),
    senderName: String(data.senderName ?? ''),
    body: String(data.body ?? ''),
    createdAt: String(data.createdAt ?? ''),
    updatedAt: String(data.updatedAt ?? ''),
  };
}

/**
 * Safely converts unknown Firestore role values into known app roles.
 */
function normaliseSenderRole(role: unknown): AsyncSupportRole {
  if (role === 'tutor') {
    return 'tutor';
  }

  return 'student';
}