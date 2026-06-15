/* eslint-disable @typescript-eslint/no-require-imports */

// DRY_RUN=true node scripts/reset-leo-sarah.cjs
// node scripts/reset-leo-sarah.cjs

const { loadEnvConfig } = require("@next/env");
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

loadEnvConfig(process.cwd());

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!raw) {
  throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
}

const serviceAccount = JSON.parse(raw);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();
const db = getFirestore();

const DRY_RUN = process.env.DRY_RUN === "true";

const TARGET_EMAILS = [
  // Current old demo accounts
  "test-student-1@gmail.com",
  "test-tutor-1@gmail.com",

  // Final presentation accounts, in case they already exist from testing
  "leo.walter2008@gmail.com",
  "sarah.sylvester2006@gmail.com",
];

const deletedPaths = new Set();

async function findTargetUsers() {
  const users = [];

  for (const email of TARGET_EMAILS) {
    try {
      const user = await auth.getUserByEmail(email);
      users.push(user);
      console.log(`Found ${email}: ${user.uid}`);
    } catch {
      console.log(`No Auth user found for ${email}`);
    }
  }

  return users;
}

async function deleteRef(ref, label) {
  if (deletedPaths.has(ref.path)) return;
  deletedPaths.add(ref.path);

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would delete ${label}: ${ref.path}`);
    return;
  }

  console.log(`Deleting ${label}: ${ref.path}`);
  await db.recursiveDelete(ref);
}

async function deleteDirectDoc(collectionName, uid) {
  const ref = db.collection(collectionName).doc(uid);
  const snap = await ref.get();

  if (snap.exists) {
    await deleteRef(ref, collectionName);
  }
}

async function deleteDocsByField(collectionName, field, uid) {
  const snapshot = await db
    .collection(collectionName)
    .where(field, "==", uid)
    .get();

  for (const doc of snapshot.docs) {
    await deleteRef(doc.ref, `${collectionName} where ${field} == ${uid}`);
  }
}

async function resetUid(uid) {
  console.log(`\nResetting UID: ${uid}`);

  await deleteDirectDoc("users", uid);
  await deleteDirectDoc("studentProfiles", uid);
  await deleteDirectDoc("tutorProfiles", uid);

  await deleteDocsByField("trialSessionRequests", "studentId", uid);
  await deleteDocsByField("trialSessionRequests", "tutorId", uid);

  await deleteDocsByField("studentTutorRelationships", "studentId", uid);
  await deleteDocsByField("studentTutorRelationships", "tutorId", uid);

  await deleteDocsByField("bookingRequests", "studentId", uid);
  await deleteDocsByField("bookingRequests", "tutorId", uid);

  await deleteDocsByField("bookingNotifications", "userId", uid);

  await deleteDocsByField("tutorStudentLinks", "studentId", uid);
  await deleteDocsByField("tutorStudentLinks", "tutorId", uid);
}

async function deleteAuthUser(user) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would delete Auth user ${user.email}: ${user.uid}`);
    return;
  }

  console.log(`Deleting Auth user ${user.email}: ${user.uid}`);
  await auth.deleteUser(user.uid);
}

async function main() {
  const users = await findTargetUsers();

  if (users.length === 0) {
    console.log("\nNo matching users found. Nothing to reset.");
    return;
  }

  const uniqueUsers = Array.from(
    new Map(users.map((user) => [user.uid, user])).values()
  );

  for (const user of uniqueUsers) {
    await resetUid(user.uid);
  }

  for (const user of uniqueUsers) {
    await deleteAuthUser(user);
  }

  console.log("\nDone.");
  console.log("Now sign up again through the app with:");
  console.log("- leo.walter2008@gmail.com");
  console.log("- sarah.sylvester2006@gmail.com");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});