/**
 * Firebase Admin SDK for Next.js API routes (server-only).
 *
 * CONFIG: set FIREBASE_SERVICE_ACCOUNT_JSON to the full service-account key JSON
 * string (from Firebase Console → Project settings → Service accounts).
 */

import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function initAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
    return initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
    });
  }

  throw new Error(
    'Missing FIREBASE_SERVICE_ACCOUNT_JSON — required for meeting-link API routes'
  );
}

const adminApp = initAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
