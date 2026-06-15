/**
 * File purpose:
 * Client boundary for automatic urgent-message emails.
 *
 * Students still send the message through Firestore first. When the message is
 * urgent, this service calls a server route that verifies the student is part of
 * the relationship, reads the saved message/attachments, and sends the tutor an
 * email through Resend.
 */

import type { StudentTutorRelationship } from '@/domains/async-support/types/asyncSupport';
import { getCurrentFirebaseUser } from '@/domains/auth/services/authService';

type UrgentMessageEmailInput = {
  relationshipId: string;
  messageId: string;
};

/** True when this relationship has enough contact data for automatic urgent email. */
export function canEmailTutorForUrgentMessage(
  relationship: StudentTutorRelationship | null
) {
  return Boolean(relationship?.tutorEmail);
}

/** Sends an automatic urgent email to the tutor using the server API route. */
export async function sendUrgentMessageEmail({
  relationshipId,
  messageId,
}: UrgentMessageEmailInput) {
  const firebaseUser = getCurrentFirebaseUser();

  if (!firebaseUser) {
    throw new Error('Please log in again before sending urgent email.');
  }

  const idToken = await firebaseUser.getIdToken();

  const response = await fetch('/api/urgent-message-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ relationshipId, messageId }),
  });

  if (!response.ok) {
    let detail = 'Urgent email failed.';
    try {
      const data = (await response.json()) as { error?: string };
      detail = data.error || detail;
    } catch {
      detail = await response.text();
    }

    throw new Error(detail);
  }
}
