/**
 * Firestore collection names used by the app.
 *
 * Keeping names in one file avoids typo bugs such as writing
 * 'trialSessionRequest' in one file and 'trialSessionRequests' in another.
 */
export const FIRESTORE_COLLECTIONS = {
  trialSessionRequests: 'trialSessionRequests',
} as const;
