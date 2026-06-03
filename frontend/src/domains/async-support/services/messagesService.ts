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
  ReplyToMessageSummary,
  SupportAttachment,
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
  attachments?: SupportAttachment[];
  replyTo?: ReplyToMessageSummary;
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
  const attachments = input.attachments ?? [];

  const messageData = {
    relationshipId: input.relationshipId,
    senderId: input.senderId,
    senderRole: input.senderRole,
    senderName: input.senderName,
    body: trimmedBody,
    attachments,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    createdAt: now,
    updatedAt: now,
  };

  const messageRef = await addDoc(
    getMessagesCollection(input.relationshipId),
    messageData
  );

  await updateDoc(getRelationshipDocument(input.relationshipId), {
    latestMessagePreview: buildMessagePreview(trimmedBody, attachments.length),
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
    attachments: normaliseAttachments(data.attachments),
    replyTo: normaliseReplyToMessage(data.replyTo),
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

function normaliseAttachments(value: unknown): SupportAttachment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((attachment, index) => {
    const data = attachment as Record<string, unknown>;

    return {
      id: String(data.id ?? `attachment-${index}`),
      name: String(data.name ?? 'Attachment'),
      url: String(data.url ?? ''),
      storagePath: String(data.storagePath ?? ''),
      contentType: String(data.contentType ?? 'application/octet-stream'),
      sizeBytes: Number(data.sizeBytes ?? 0),
      kind:
        data.kind === 'image' || data.kind === 'pdf' || data.kind === 'file'
          ? data.kind
          : 'file',
      createdAt: String(data.createdAt ?? ''),
      provider:
        data.provider === 'demo-metadata' ||
        data.provider === 'firebase-storage' ||
        data.provider === 'external-url'
          ? data.provider
          : undefined,
      isPreviewAvailable:
        typeof data.isPreviewAvailable === 'boolean'
          ? data.isPreviewAvailable
          : Boolean(data.url),
      ownerArea: typeof data.ownerArea === 'string' ? data.ownerArea : undefined,
      ownerId: typeof data.ownerId === 'string' ? data.ownerId : undefined,
      uploadedById:
        typeof data.uploadedById === 'string' ? data.uploadedById : undefined,
    };
  });
}


function normaliseReplyToMessage(value: unknown): ReplyToMessageSummary | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const data = value as Record<string, unknown>;
  const messageId = String(data.messageId ?? '');

  if (!messageId) {
    return undefined;
  }

  return {
    messageId,
    senderId: String(data.senderId ?? ''),
    senderName: String(data.senderName ?? 'Unknown user'),
    bodyPreview: String(data.bodyPreview ?? ''),
    attachmentCount: Number(data.attachmentCount ?? 0),
    createdAt: String(data.createdAt ?? ''),
  };
}

/** Keeps dashboard/notification previews readable and compact. */
function buildMessagePreview(body: string, attachmentCount: number) {
  const singleLineBody = body.replace(/\s+/g, ' ').trim();

  if (!singleLineBody && attachmentCount > 0) {
    return attachmentCount === 1 ? 'Sent an attachment' : `Sent ${attachmentCount} attachments`;
  }

  const attachmentSuffix = attachmentCount > 0 ? ` (${attachmentCount} attachment${attachmentCount === 1 ? '' : 's'})` : '';
  const previewLimit = Math.max(MESSAGE_PREVIEW_LENGTH - attachmentSuffix.length, 20);

  if (singleLineBody.length <= previewLimit) {
    return `${singleLineBody}${attachmentSuffix}`;
  }

  return `${singleLineBody.slice(0, previewLimit - 1)}…${attachmentSuffix}`;
}
