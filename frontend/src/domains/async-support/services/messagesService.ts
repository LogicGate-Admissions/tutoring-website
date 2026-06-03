/**
 * File purpose:
 * Firestore service functions for async-support messages.
 *
 * Messages belong to one student-tutor relationship:
 * studentTutorRelationships/{relationshipId}/messages/{messageId}
 *
 * When a message is sent, we also update latest-message metadata on the parent
 * relationship so dashboards and notification bells can show activity quickly.
 */

import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import type {
  AsyncSupportRole,
  SupportMessage,
} from '@/domains/async-support/types/asyncSupport';

const RELATIONSHIPS_COLLECTION = 'studentTutorRelationships';
const MESSAGES_SUBCOLLECTION = 'messages';
const MESSAGE_PREVIEW_LENGTH = 120;

type CreateSupportMessageInput = {
  relationshipId: string;
  senderId: string;
  senderRole: AsyncSupportRole;
  senderName: string;
  body: string;
};

/** Returns the Firestore collection reference for relationship messages. */
function getMessagesCollection(relationshipId: string) {
  return collection(
    db,
    RELATIONSHIPS_COLLECTION,
    relationshipId,
    MESSAGES_SUBCOLLECTION
  );
}

/** Returns the parent relationship document reference. */
function getRelationshipDocument(relationshipId: string) {
  return doc(db, RELATIONSHIPS_COLLECTION, relationshipId);
}

/** Loads all messages for one relationship, oldest first. */
export async function getSupportMessages(
  relationshipId: string
): Promise<SupportMessage[]> {
  const messagesQuery = buildMessagesQuery(relationshipId);
  const snapshot = await getDocs(messagesQuery);

  return snapshot.docs.map((messageDoc) =>
    mapSupportMessageSnapshot(messageDoc.id, messageDoc.data())
  );
}

/**
 * Subscribes to messages for one relationship.
 *
 * The message thread uses this so users see new messages without refreshing.
 */
export function subscribeToSupportMessages({
  relationshipId,
  onChange,
  onError,
}: {
  relationshipId: string;
  onChange: (messages: SupportMessage[]) => void;
  onError?: (error: Error) => void;
}) {
  return onSnapshot(
    buildMessagesQuery(relationshipId),
    (snapshot) => {
      onChange(
        snapshot.docs.map((messageDoc) =>
          mapSupportMessageSnapshot(messageDoc.id, messageDoc.data())
        )
      );
    },
    (error) => {
      onError?.(error);
    }
  );
}

/** Adds a new message and updates relationship-level latest-message metadata. */
export async function createSupportMessage(
  input: CreateSupportMessageInput
): Promise<SupportMessage> {
  const now = new Date().toISOString();
  const trimmedBody = input.body.trim();

  const messageData = {
    relationshipId: input.relationshipId,
    senderId: input.senderId,
    senderRole: input.senderRole,
    senderName: input.senderName,
    body: trimmedBody,
    createdAt: now,
    updatedAt: now,
  };

  const messageRef = await addDoc(
    getMessagesCollection(input.relationshipId),
    messageData
  );

  await updateDoc(getRelationshipDocument(input.relationshipId), {
    latestMessagePreview: buildMessagePreview(trimmedBody),
    latestMessageAt: now,
    latestMessageSenderId: input.senderId,
    latestMessageSenderName: input.senderName,
    latestMessageSenderRole: input.senderRole,
    updatedAt: now,
  });

  return {
    id: messageRef.id,
    ...messageData,
  };
}

function buildMessagesQuery(relationshipId: string) {
  return query(getMessagesCollection(relationshipId), orderBy('createdAt', 'asc'));
}

/** Converts Firestore message data into the app message type. */
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

/** Safely converts unknown Firestore role values into known app roles. */
function normaliseSenderRole(role: unknown): AsyncSupportRole {
  if (role === 'tutor') {
    return 'tutor';
  }

  return 'student';
}

/** Keeps dashboard/notification previews readable and compact. */
function buildMessagePreview(body: string) {
  const singleLineBody = body.replace(/\s+/g, ' ').trim();

  if (singleLineBody.length <= MESSAGE_PREVIEW_LENGTH) {
    return singleLineBody;
  }

  return `${singleLineBody.slice(0, MESSAGE_PREVIEW_LENGTH - 1)}…`;
}
