import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase configuration loaded from .env.local.
 *
 * NEXT_PUBLIC_ variables are exposed to the browser by Next.js. Firebase client
 * config is safe to expose, but keeping it in env vars lets each deployment use
 * a different Firebase project without changing source code.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};

/**
 * Reuse the existing Firebase app during hot reloads in development.
 */
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

/**
 * Shared Firestore database instance.
 */
export const db = getFirestore(app);
