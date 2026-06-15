/**
 * File purpose: server-only Firebase Admin initialisation.
 *
 * API routes use this helper when they need trusted Firestore access. The admin
 * app is created lazily so normal frontend builds do not fail unless a route is
 * actually executed without the required server environment variable.
 */

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

type FirebaseServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function getServiceAccount(): FirebaseServiceAccount {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!rawServiceAccount) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON.');
  }

  const serviceAccount = JSON.parse(rawServiceAccount) as FirebaseServiceAccount;

  return {
    ...serviceAccount,
    private_key: serviceAccount.private_key.replace(/\\n/g, '\n'),
  };
}

function ensureFirebaseAdminApp() {
  if (getApps().length > 0) return;

  const serviceAccount = getServiceAccount();

  initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
  });
}

export function getFirebaseAdminDb() {
  ensureFirebaseAdminApp();
  return getFirestore();
}

export function getFirebaseAdminAuth() {
  ensureFirebaseAdminApp();
  return getAuth();
}
