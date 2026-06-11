/**
 * File purpose:
 * Shared TypeScript types for asynchronous support.
 *
 * A support relationship is the shared space between one student and one tutor.
 * Messages, resources, and future notification indicators all
 * attach to this relationship so context stays in one place.
 */

/** The two user roles that can access an async support relationship. */
export type AsyncSupportRole = 'student' | 'tutor';

/** Generic attachment category stored with messages/resources. */
export type SupportAttachmentKind = 'image' | 'pdf' | 'file';

/** Generic attachment metadata for support content. */
export type SupportAttachment = {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  kind: SupportAttachmentKind;
  createdAt: string;
  /** Identifies the provider used to create this attachment metadata. */
  provider?: 'demo-metadata' | 'firebase-storage' | 'external-url';
  /** True when the attachment has a URL that can be opened or previewed. */
  isPreviewAvailable?: boolean;
  /** Generic ownership fields so the same attachment type can support resources/homework later. */
  ownerArea?: string;
  ownerId?: string;
  uploadedById?: string;
};

/** Status for a student-tutor relationship. */
export type StudentTutorRelationshipStatus = 'active' | 'ended';

/** Urgency level for messages that need extra tutor attention. */
export type MessageUrgency = 'normal' | 'urgent';

/** Text-only messages sent before a tutor accepts a match request. */
export type PreBookingMessage = {
  id: string;
  senderId: string;
  senderRole: AsyncSupportRole;
  senderName: string;
  body: string;
  createdAt: string;
};

/** Metadata for the latest message stored on a relationship document. */
export type LatestMessageSummary = {
  latestMessagePreview?: string;
  latestMessageAt?: string;
  latestMessageSenderId?: string;
  latestMessageSenderName?: string;
  latestMessageSenderRole?: AsyncSupportRole;
  /** True when the latest message was marked by a student as urgent. */
  latestMessageUrgency?: MessageUrgency;
};

/** Per-role read timestamps for relationship messages. */
export type MessageSeenSummary = {
  studentLastSeenMessagesAt?: string;
  tutorLastSeenMessagesAt?: string;
};

/**
 * A relationship connects one student with one tutor.
 *
 * The latest-message fields are duplicated onto the relationship document so
 * dashboards and notification menus can show activity without querying every
 * messages subcollection.
 */
export type StudentTutorRelationship = {
  id: string;

  studentId: string;
  tutorId: string;

  studentName: string;
  tutorName: string;

  /** Stored for future student-side email/notification flows. */
  studentEmail?: string;

  /** Used by the urgent message flow to open an email draft for tutors. */
  tutorEmail?: string;

  subject: string;
  level: string;

  status: StudentTutorRelationshipStatus;

  /** Text-only messages from the pre-booking clarifying conversation. */
  preBookingMessages?: PreBookingMessage[];

  /** Persistent Miro board created for this student-tutor pair. */
  miroBoardId?: string;
  miroBoardUrl?: string;
  miroEmbedUrl?: string;
  miroBoardName?: string;
  miroCreatedAt?: string;

  createdAt: string;
  updatedAt: string;
} & LatestMessageSummary &
  MessageSeenSummary;

/** Lightweight message data copied onto replies for stable quoted previews. */
export type ReplyToMessageSummary = {
  messageId: string;
  senderId: string;
  senderName: string;
  bodyPreview: string;
  attachmentCount: number;
  createdAt: string;
};

/** A message inside a student/tutor support relationship. */
export type SupportMessage = {
  id: string;

  relationshipId: string;

  senderId: string;
  senderRole: AsyncSupportRole;
  senderName: string;

  body: string;
  attachments: SupportAttachment[];

  /** Optional quoted message summary used for WhatsApp-style replies. */
  replyTo?: ReplyToMessageSummary;

  /** Student-only flag for messages that need quick tutor attention. */
  urgency: MessageUrgency;

  /** Soft-delete metadata keeps the message anchor available for replies/jump links. */
  isDeleted?: boolean;
  deletedAt?: string;
  deletedById?: string;

  createdAt: string;
  updatedAt: string;
};

/** Status for a flagged academic question. */
export type FlaggedQuestionStatus =
  | 'new'
  | 'tutor-replied'
  | 'saved-for-lesson'
  | 'resolved';

/** A question that a student flags for async support. */
export type FlaggedQuestion = {
  id: string;

  relationshipId: string;

  createdByStudentId: string;

  subject: string;
  topic: string;
  questionText: string;

  screenshotUrl?: string;

  status: FlaggedQuestionStatus;

  tutorNote?: string;

  createdAt: string;
  updatedAt: string;
};

/** Type/category for a shared resource. */
export type SharedResourceType = 'link' | 'file' | 'note';

/** A resource shared between a student and tutor. */
export type SharedResource = {
  id: string;

  relationshipId: string;

  createdById: string;
  createdByRole: AsyncSupportRole;
  createdByName: string;

  title: string;
  description?: string;

  type: SharedResourceType;

  url?: string;

  /** Uploaded file metadata when this resource is a Firebase Storage file. */
  attachment?: SupportAttachment;

  createdAt: string;
  updatedAt: string;
};

/**
 * A compact summary used by dashboard cards/lists.
 *
 * unreadMessageCount is intentionally 0 or 1 for now: it means this
 * relationship has message activity from the other person that has not been
 * opened yet. The shape can later grow into full unread counts.
 */
export type RelationshipSupportSummary = StudentTutorRelationship & {
  unreadMessageCount: number;
  hasUnreadMessageActivity: boolean;
  openQuestionCount: number;
  resourceCount: number;
};
