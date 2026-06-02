/**
 * Current lifecycle states for a trial session request.
 */
export type TrialSessionStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Trial session request shared by student and tutor views.
 */
export type TrialSessionRequest = {
  id: string;
  tutorId: string;
  tutorName: string;
  studentId: string;
  studentName: string;
  subject: string;
  level: string;
  learningStyle: string;
  preferredTime: string;
  message: string;
  status: TrialSessionStatus;
};

/**
 * Data needed before a request exists in Firestore.
 */
export type CreateTrialSessionRequestInput = Omit<
  TrialSessionRequest,
  'id' | 'status'
>;
