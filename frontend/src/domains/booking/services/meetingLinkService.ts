/**
 * Client service to request Google Meet link creation via the Next.js API route.
 */

import { auth } from '@/shared/lib/firebase';

export type MeetingLinkResult = {
  meetingLink?: string;
  meetingLinkStatus: 'ready' | 'pending' | 'failed' | 'skipped';
  error?: string;
};

export async function requestMeetingLink(bookingId: string): Promise<MeetingLinkResult> {
  const user = auth.currentUser;
  if (!user) {
    return { meetingLinkStatus: 'failed', error: 'Not signed in' };
  }

  const idToken = await user.getIdToken();

  const response = await fetch(`/api/bookings/${bookingId}/meeting-link`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  const body = (await response.json()) as MeetingLinkResult;

  if (!response.ok && !body.meetingLinkStatus) {
    return {
      meetingLinkStatus: 'failed',
      error: body.error ?? `Request failed (${response.status})`,
    };
  }

  return body;
}
