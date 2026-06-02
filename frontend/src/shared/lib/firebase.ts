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
 * 2. are accessed directly, for example:
 *    process.env.NEXT_PUBLIC_FIREBASE_API_KEY
 *
 * Do not use dynamic access like process.env[name].
 * Next.js may not replace that correctly in the browser bundle, which causes
 * Firebase to receive the demo/fallback key and throw:
 * auth/api-key-not-valid
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
 * This gives us a clear setup error instead of letting Firebase fail later
 * with a vague invalid API key message.
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

/**
 * Check the Firebase config before initialising the SDK.
 *
 * This protects local development and deployment from silently using an
 * incomplete Firebase configuration.
 */
assertFirebaseConfigIsPresent();

/**
 * Reuse an existing Firebase app during local development.
 *
 * Next.js hot reload can re-run modules multiple times. Firebase only allows
 * one app initialisation per config, so we reuse the existing app when present.
 */
const firebaseApp =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

/**
 * Firebase Authentication instance.
 *
 * Used for:
 * - email/password sign up
 * - email/password login
 * - Google login
 * - sign out
 * - reading the current signed-in user
 */
export const auth = getAuth(firebaseApp);

/**
 * Firestore database instance.
 *
 * Used for:
 * - user role documents
 * - student profiles
 * - tutor profiles
 * - academic subject options
 * - trial session requests
 */
export const db = getFirestore(firebaseApp);

/**
 * Google sign-in provider.
 *
 * Passed into signInWithPopup() inside the auth service.
 */
export const googleProvider = new GoogleAuthProvider();