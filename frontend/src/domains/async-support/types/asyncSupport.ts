/**
 * File purpose:
 * Shared TypeScript types for the asynchronous support feature.
 *
 * This feature covers:
 * - student/tutor support relationships
 * - messages
 * - flagged academic questions
 * - shared learning resources
 *
 * These are only types for now. Firestore services and UI components will be
 * added in later steps.
 */

/**
 * The two user roles that can access an async support relationship.
 */
export type AsyncSupportRole = 'student' | 'tutor';

/**
 * A relationship connects one student with one tutor.
 *
 * Messages, flagged questions, and shared resources will all belong to one
 * relationship. This prevents duplication because both dashboards can
 * point to the same relationship routes later.
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
};

/**
 * Relationship status.
 *
 * For now we mainly need "active", but keeping "ended" makes the type ready
 * for future cases where a student/tutor relationship is no longer ongoing.
 */
export type StudentTutorRelationshipStatus = 'active' | 'ended';

/**
 * A message inside a student/tutor support relationship.
 */
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

/**
 * Status for a flagged academic question.
 *
 * This allows the question to move through a small support workflow:
 * new question -> tutor has replied / saved for lesson -> resolved.
 */
export type FlaggedQuestionStatus =
  | 'new'
  | 'tutor-replied'
  | 'saved-for-lesson'
  | 'resolved';

/**
 * A question that a student flags for async support.
 *
 * The screenshotUrl is optional because we can first build the question flow
 * without file upload, then add upload support later.
 */
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

/**
 * Type/category for a shared resource.
 */
export type SharedResourceType = 'link' | 'file' | 'note';

/**
 * A resource shared between a student and tutor.
 *
 * This can later represent:
 * - a URL link
 * - an uploaded file
 * - a short note/resource written directly in the app
 */
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
 * The dashboard uses this shape to show each support relationship with
 * message, question, and resource activity.
 */
export type RelationshipSupportSummary = StudentTutorRelationship & {
  lastMessagePreview?: string;
  unreadMessageCount: number;
  openQuestionCount: number;
  resourceCount: number;
};