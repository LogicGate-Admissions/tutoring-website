/**
 * Helpers for displaying the state of a pre-booking / match request.
 *
 * A student can message a tutor before requesting a match, so a
 * trialSessionRequests document can exist even when there is not yet an actual
 * match request. These helpers keep the UI from showing "Awaiting tutor reply"
 * for message-only conversations.
 */

import type { TrialSessionRequest } from '@/domains/sessions/trial-sessions/types/trialSession';

const AUTOMATIC_MATCH_REQUEST_PHRASES = [
  'i would like to request a match',
  'i would like to request the match again',
  'request a match',
];

export function hasRequestedMatch(request?: TrialSessionRequest | null) {
  if (!request) return false;

  if (request.status === 'accepted' || request.status === 'rejected') {
    return true;
  }

  const reasons = request.pendingReasons ?? [];
  if (reasons.includes('requested')) {
    return true;
  }

  const requestMessage = request.message.toLowerCase();
  if (AUTOMATIC_MATCH_REQUEST_PHRASES.some((phrase) => requestMessage.includes(phrase))) {
    return true;
  }

  return (request.preBookingMessages ?? []).some((message) => {
    const body = message.body.toLowerCase();
    return AUTOMATIC_MATCH_REQUEST_PHRASES.some((phrase) => body.includes(phrase));
  });
}

export function getMatchRequestButtonLabel(request?: TrialSessionRequest | null) {
  if (!request || !hasRequestedMatch(request)) {
    return 'Request match';
  }

  return {
    pending: 'Request sent',
    accepted: 'Accepted',
    rejected: 'Request again',
  }[request.status];
}

export function isMatchRequestLocked(request?: TrialSessionRequest | null) {
  return Boolean(
    request &&
      hasRequestedMatch(request) &&
      (request.status === 'pending' || request.status === 'accepted')
  );
}

export function getTrialRequestDisplayPriority(request: TrialSessionRequest) {
  if (request.status === 'accepted') return 60;

  if (hasRequestedMatch(request)) {
    if (request.status === 'pending') return 50;
    if (request.status === 'rejected') return 40;
  }

  if ((request.preBookingMessages ?? []).length > 0) return 30;
  if ((request.pendingReasons ?? []).includes('messaged')) return 20;

  return 10;
}
