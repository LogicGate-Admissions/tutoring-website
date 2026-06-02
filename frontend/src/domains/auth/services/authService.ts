/**
 * File purpose: Real Firebase Authentication service boundary.
 *
 * React components should call this file instead of using Firebase Auth
 * directly. That keeps the UI readable and gives us one place to enforce:
 * - student/tutor role rules
 * - user document creation
 * - onboarding redirect decisions
 */

import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/shared/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/shared/constants/firestoreCollections';
import type { AuthMode, AuthRole, AuthUser, EmailPasswordAuthValues } from '@/domains/auth/types/auth';

/** Firestore shape for account metadata stored in `users/{uid}`. */
type StoredUserDocument = {
  email: string;
  name: string;
  role: AuthRole;
  hasCompletedOnboarding: boolean;
};

/** Return the current Firebase Auth user if Firebase already knows one. */
export function getCurrentFirebaseUser() {
  return auth.currentUser;
}

/** Build the role-specific user-document reference once instead of repeating it. */
function userDocumentRef(userId: string) {
  return doc(db, FIRESTORE_COLLECTIONS.users, userId);
}

/** Convert Firebase + Firestore account data into the app-level AuthUser type. */
function toAuthUser(firebaseUser: User, storedUser: StoredUserDocument): AuthUser {
  return {
    id: firebaseUser.uid,
    email: storedUser.email,
    name: storedUser.name,
    role: storedUser.role,
    hasCompletedOnboarding: storedUser.hasCompletedOnboarding,
  };
}

/**
 * Create the first Firestore account document for a new Firebase Auth user.
 *
 * Firebase Auth stores credentials. Firestore stores product role metadata.
 * Keeping them separate is the standard Firebase approach.
 */
async function createUserDocument(firebaseUser: User, role: AuthRole, name: string) {
  const email = firebaseUser.email ?? '';
  const displayName = name.trim() || firebaseUser.displayName || email.split('@')[0] || role;

  await setDoc(userDocumentRef(firebaseUser.uid), {
    email,
    name: displayName,
    role,
    hasCompletedOnboarding: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Read the Firestore account document for the currently signed-in Firebase user.
 *
 * A missing document is possible when someone signed in before we introduced
 * role documents, so callers decide how to repair that depending on context.
 */
async function readUserDocument(firebaseUser: User) {
  const snapshot = await getDoc(userDocumentRef(firebaseUser.uid));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as StoredUserDocument;
}

/** Throw a useful error when a user tries to enter the wrong role area. */
function assertRoleMatches(account: AuthUser, requestedRole: AuthRole) {
  if (account.role !== requestedRole) {
    throw new Error(
      `This account is registered as a ${account.role}. Please use the ${account.role} login page.`
    );
  }
}

/** Create a new email/password account and attach the requested product role. */
export async function signUpWithEmailAndPassword(role: AuthRole, values: EmailPasswordAuthValues) {
  const credentials = await createUserWithEmailAndPassword(
    auth,
    values.email.trim(),
    values.password
  );

  const name = values.name.trim();

  if (name) {
    await updateProfile(credentials.user, { displayName: name });
  }

  await createUserDocument(credentials.user, role, name);

  const storedUser = await readUserDocument(credentials.user);

  if (!storedUser) {
    throw new Error('Your account was created, but the profile document could not be loaded.');
  }

  return toAuthUser(credentials.user, storedUser);
}

/** Sign in with email/password and verify the account belongs to the requested role. */
export async function logInWithEmailAndPassword(role: AuthRole, values: EmailPasswordAuthValues) {
  const credentials = await signInWithEmailAndPassword(
    auth,
    values.email.trim(),
    values.password
  );

  const storedUser = await readUserDocument(credentials.user);

  if (!storedUser) {
    await signOut(auth);
    throw new Error('This account is missing a role profile. Please create a new account.');
  }

  const account = toAuthUser(credentials.user, storedUser);
  assertRoleMatches(account, role);

  return account;
}

/**
 * Continue with Google and create the role document only when this is a new app user.
 *
 * If the Firebase account already has a Firestore role, we respect that role and
 * prevent accidental cross-login between student and tutor areas.
 */
export async function continueWithGoogle(role: AuthRole) {
  const credentials = await signInWithPopup(auth, googleProvider);
  const existingUser = await readUserDocument(credentials.user);

  if (!existingUser) {
    await createUserDocument(credentials.user, role, credentials.user.displayName ?? '');
    const newUser = await readUserDocument(credentials.user);

    if (!newUser) {
      throw new Error('Your Google account was created, but the profile could not be loaded.');
    }

    return toAuthUser(credentials.user, newUser);
  }

  const account = toAuthUser(credentials.user, existingUser);
  assertRoleMatches(account, role);

  return account;
}

/** Shared auth entry point used by the login/sign-up page. */
export function authenticateWithEmailAndPassword(
  mode: AuthMode,
  role: AuthRole,
  values: EmailPasswordAuthValues
) {
  return mode === 'signup'
    ? signUpWithEmailAndPassword(role, values)
    : logInWithEmailAndPassword(role, values);
}

/** Listen to Firebase auth state and resolve the app-level user document. */
export function subscribeToCurrentUser(onChange: (user: AuthUser | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      onChange(null);
      return;
    }

    const storedUser = await readUserDocument(firebaseUser);
    onChange(storedUser ? toAuthUser(firebaseUser, storedUser) : null);
  });
}

/** Mark onboarding complete once a role-specific onboarding flow is finished. */
export async function markOnboardingComplete(userId: string) {
  await updateDoc(userDocumentRef(userId), {
    hasCompletedOnboarding: true,
    updatedAt: serverTimestamp(),
  });
}

/** Sign out of Firebase Auth. */
export function signOutCurrentUser() {
  return signOut(auth);
}
