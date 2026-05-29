import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export type TrialRequestStatus = 'pending' | 'accepted' | 'rejected';

export type TrialRequest = {
  id: string;
  tutorId: string;
  tutorName: string;
  studentName: string;
  subject: string;
  level: string;
  learningStyle: string;
  preferredTime: string;
  message: string;
  status: TrialRequestStatus;
};

export async function createTrialRequest({
  tutorId,
  tutorName,
  studentName,
  subject,
  level,
  learningStyle,
  preferredTime,
  message,
}: Omit<TrialRequest, 'id' | 'status'>) {
  await addDoc(collection(db, 'trialSessionRequests'), {
    tutorId,
    tutorName,
    studentName,
    subject,
    level,
    learningStyle,
    preferredTime,
    message,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function updateTrialRequestStatus(
  requestId: string,
  status: TrialRequestStatus
) {
  const requestRef = doc(db, 'trialSessionRequests', requestId);
  await updateDoc(requestRef, { status });
}