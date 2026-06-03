/**
 * File purpose:
 * Shared TypeScript types for asynchronous support.
 *
 * A support relationship is the shared space between one student and one tutor.
 * Messages, flagged questions, resources, and future notification indicators all
 * attach to this relationship so context stays in one place.
 */

/** The two user roles that can access an async support relationship. */
export type AsyncSupportRole = 'student' | 'tutor';

/** Status for a student-tutor relationship. */
export type StudentTutorRelationshipStatus = 'active' | 'ended';

/** Metadata for the latest message stored on a relationship document. */
export type LatestMessageSummary = {
  latestMessagePreview?: string;
  latestMessageAt?: string;
  latestMessageSenderId?: string;
  latestMessageSenderName?: string;
  latestMessageSenderRole?: AsyncSupportRole;
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

  subject: string;
  level: string;

  status: StudentTutorRelationshipStatus;

  createdAt: string;
  updatedAt: string;
} & LatestMessageSummary &
  MessageSeenSummary;

/** A message inside a student/tutor support relationship. */
export type SupportMessage = {
  id: string;

  relationshipId: string;

  senderId: string;
  senderRole: AsyncSupportRole;
  senderName: string;

  body: string;

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
