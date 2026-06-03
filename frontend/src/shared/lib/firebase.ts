/**
 * File purpose: Initialise Firebase once and export shared SDK instances.
 *
 * This file is the only place where the app should create Firebase SDK
 * instances. Keeping it centralised prevents duplicated Firebase setup across
 * features and avoids multiple initialisations during Next.js hot reload.
 */

import { getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase client configuration.
 *
 * Important:
 * Next.js only exposes browser environment variables when they:
 * 1. start with NEXT_PUBLIC_
 * 2. are accessed directly, for example process.env.NEXT_PUBLIC_FIREBASE_API_KEY
 *
 * Do not use dynamic access like process.env[name]. Next.js may not replace it
 * correctly in the browser bundle, which causes Firebase to receive a bad key.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Fail early if Firebase config is missing.
 *
 * This gives a clear setup error instead of letting Firebase fail later with a
 * vague auth/api-key-not-valid message.
 */
function assertFirebaseConfigIsPresent() {
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missingKeys.join(', ')}`
    );
  }
}

assertFirebaseConfigIsPresent();

/** Reuse an existing Firebase app during local development hot reloads. */
const firebaseApp =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

/** Firebase Authentication instance used by the auth domain. */
export const auth = getAuth(firebaseApp);

/** Firestore database instance used by all persistence services. */
export const db = getFirestore(firebaseApp);

/** Google sign-in provider used by the auth service. */
export const googleProvider = new GoogleAuthProvider();
