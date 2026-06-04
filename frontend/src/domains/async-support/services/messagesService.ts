/**
 * File purpose:
 * Firestore service functions for async-support messages.
 *
 * Messages belong to one student-tutor relationship:
 * studentTutorRelationships/{relationshipId}/messages/{messageId}
 *
 * Message writes also refresh relationship-level activity metadata so dashboard
 * notifications stay fast and do not need to query every messages subcollection.
 */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import type {
  AsyncSupportRole,
  MessageUrgency,
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
  urgency?: MessageUrgency;
};

type UpdateSupportMessageInput = {
  relationshipId: string;
  messageId: string;
  body?: string;
  urgency?: MessageUrgency;
};

type DeleteSupportMessageInput = {
  relationshipId: string;
  messageId: string;
  deletedById: string;
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

/** Returns one message document reference. */
function getMessageDocument(relationshipId: string, messageId: string) {
  return doc(
    db,
    RELATIONSHIPS_COLLECTION,
    relationshipId,
    MESSAGES_SUBCOLLECTION,
    messageId
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
  const urgency = normaliseMessageUrgency(input.urgency);

  const messageData = {
    relationshipId: input.relationshipId,
    senderId: input.senderId,
    senderRole: input.senderRole,
    senderName: input.senderName,
    body: trimmedBody,
    attachments,
    urgency,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    createdAt: now,
    updatedAt: now,
  };

  const messageRef = await addDoc(
    getMessagesCollection(input.relationshipId),
    messageData
  );

  await updateRelationshipLatestMessage(
    input.relationshipId,
    mapSupportMessageSnapshot(messageRef.id, messageData)
  );

  return {
    id: messageRef.id,
    ...messageData,
  };
}

/** Edits a message body and/or urgency, then refreshes relationship metadata. */
export async function updateSupportMessage(input: UpdateSupportMessageInput) {
  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    updatedAt: now,
  };

  if (typeof input.body === 'string') {
    updateData.body = input.body.trim();
  }

  if (input.urgency) {
    updateData.urgency = normaliseMessageUrgency(input.urgency);
  }

  await updateDoc(
    getMessageDocument(input.relationshipId, input.messageId),
    updateData
  );

  if (input.urgency === 'urgent') {
    await promoteMessageAsUrgentActivity(input.relationshipId, input.messageId);
    return;
  }

  await refreshRelationshipLatestMessage(input.relationshipId);
}

/**
 * Soft-deletes a message and refreshes relationship-level latest-message metadata.
 *
 * We keep the document so WhatsApp-style reply cards can still jump to the
 * original message position and show a "message deleted" placeholder.
 */
export async function deleteSupportMessage(input: DeleteSupportMessageInput) {
  const now = new Date().toISOString();

  await updateDoc(getMessageDocument(input.relationshipId, input.messageId), {
    body: "",
    attachments: [],
    urgency: "normal",
    isDeleted: true,
    deletedAt: now,
    deletedById: input.deletedById,
    updatedAt: now,
  });

  await refreshRelationshipLatestMessage(input.relationshipId);
}

function buildMessagesQuery(relationshipId: string) {
  return query(getMessagesCollection(relationshipId), orderBy('createdAt', 'asc'));
}

function buildLatestMessageQuery(relationshipId: string) {
  return query(
    getMessagesCollection(relationshipId),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
}

/** Refreshes the relationship summary after edits/deletes. */
async function refreshRelationshipLatestMessage(relationshipId: string) {
  const snapshot = await getDocs(buildLatestMessageQuery(relationshipId));
  const latestDoc = snapshot.docs[0];

  if (!latestDoc) {
    await clearRelationshipLatestMessage(relationshipId);
    return;
  }

  await updateRelationshipLatestMessage(
    relationshipId,
    mapSupportMessageSnapshot(latestDoc.id, latestDoc.data())
  );
}


/** Promotes an older message into the notification stream when it is marked urgent. */
async function promoteMessageAsUrgentActivity(
  relationshipId: string,
  messageId: string
) {
  const snapshot = await getDoc(getMessageDocument(relationshipId, messageId));

  if (!snapshot.exists()) {
    await refreshRelationshipLatestMessage(relationshipId);
    return;
  }

  await updateRelationshipLatestMessage(
    relationshipId,
    mapSupportMessageSnapshot(snapshot.id, snapshot.data()),
    new Date().toISOString()
  );
}

/** Copies latest-message metadata onto the parent relationship document. */
async function updateRelationshipLatestMessage(
  relationshipId: string,
  latestMessage: SupportMessage,
  activityAt = latestMessage.createdAt
) {
  await updateDoc(getRelationshipDocument(relationshipId), {
    latestMessagePreview: latestMessage.isDeleted
      ? 'This message was deleted'
      : buildMessagePreview(
          latestMessage.body,
          latestMessage.attachments.length
        ),
    latestMessageAt: activityAt,
    latestMessageSenderId: latestMessage.senderId,
    latestMessageSenderName: latestMessage.senderName,
    latestMessageSenderRole: latestMessage.senderRole,
    latestMessageUrgency: latestMessage.urgency,
    updatedAt: new Date().toISOString(),
  });
}

/** Clears message activity metadata when the final message is deleted. */
async function clearRelationshipLatestMessage(relationshipId: string) {
  await updateDoc(getRelationshipDocument(relationshipId), {
    latestMessagePreview: '',
    latestMessageAt: '',
    latestMessageSenderId: '',
    latestMessageSenderName: '',
    latestMessageSenderRole: '',
    latestMessageUrgency: 'normal',
    updatedAt: new Date().toISOString(),
  });
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
    urgency: normaliseMessageUrgency(data.urgency),
    isDeleted: data.isDeleted === true,
    deletedAt: typeof data.deletedAt === 'string' ? data.deletedAt : undefined,
    deletedById: typeof data.deletedById === 'string' ? data.deletedById : undefined,
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

function normaliseMessageUrgency(value: unknown): MessageUrgency {
  return value === 'urgent' ? 'urgent' : 'normal';
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
