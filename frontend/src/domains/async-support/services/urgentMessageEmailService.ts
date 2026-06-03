/**
 * File purpose:
 * Browser-only email handoff for urgent student messages.
 *
 * The project is currently frontend-only, so it cannot securely send real
 * transactional emails by itself. This service opens a pre-filled mailto draft
 * addressed to the tutor. If a backend/email provider is added later, this file
 * is the only boundary that needs replacing.
 */

import type { StudentTutorRelationship } from '@/domains/async-support/types/asyncSupport';

type UrgentMessageEmailInput = {
  relationship: StudentTutorRelationship;
  studentName: string;
  messageBody: string;
  attachmentCount: number;
};

/** True when this relationship has enough contact data to open an email draft. */
export function canEmailTutorForUrgentMessage(
  relationship: StudentTutorRelationship | null
) {
  return Boolean(relationship?.tutorEmail);
}

/** Opens the user's email client with a pre-filled urgent tutor email. */
export function openUrgentMessageEmailDraft({
  relationship,
  studentName,
  messageBody,
  attachmentCount,
}: UrgentMessageEmailInput) {
  if (!relationship.tutorEmail) {
    throw new Error('Tutor email is not available for this relationship.');
  }

  window.location.href = buildUrgentMessageMailtoUrl({
    relationship,
    studentName,
    messageBody,
    attachmentCount,
  });
}

function buildUrgentMessageMailtoUrl({
  relationship,
  studentName,
  messageBody,
  attachmentCount,
}: UrgentMessageEmailInput) {
  const tutorEmail = relationship.tutorEmail;

  if (!tutorEmail) {
    throw new Error('Tutor email is not available for this relationship.');
  }

  const subject = `Urgent message from ${studentName}`;
  const bodyLines = [
    `Hi ${relationship.tutorName || 'Tutor'},`,
    '',
    `${studentName} marked a message as urgent in LogicGate.`,
    '',
    `Subject: ${relationship.level} ${relationship.subject}`.trim(),
    '',
    'Message:',
    messageBody.trim() || '(No text message — check the support thread for attachments/context.)',
    '',
    attachmentCount > 0
      ? `Attachment note: ${attachmentCount} demo attachment${attachmentCount === 1 ? '' : 's'} were added in the support thread.`
      : '',
    '',
    'Please open the support thread in the dashboard to reply with context.',
  ].filter((line) => line !== '');

  const params = new URLSearchParams({
    subject,
    body: bodyLines.join('\n'),
  });

  return `mailto:${encodeURIComponent(tutorEmail)}?${params.toString()}`;
}
