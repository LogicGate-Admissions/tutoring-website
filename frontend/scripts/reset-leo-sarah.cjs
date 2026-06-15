/* eslint-disable @typescript-eslint/no-require-imports */

// Deletes all demo accounts created by seed-demo.cjs and all associated
// Firestore data. Run this to wipe the slate before re-seeding.
//
// Usage:
//   node scripts/reset-leo-sarah.cjs          (renamed but kept for compatibility)
//   DRY_RUN=true node scripts/reset-leo-sarah.cjs

const { loadEnvConfig } = require("@next/env");
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

loadEnvConfig(process.cwd());

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");

const serviceAccount = JSON.parse(raw);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();
const DRY_RUN = process.env.DRY_RUN === "true";

// All emails created by seed-demo.cjs
const DEMO_EMAILS = [
  // Tutors
  "james.wright@demo.logicgate.com",
  "emma.thompson@demo.logicgate.com",
  "oliver.chen@demo.logicgate.com",
  "sophie.williams@demo.logicgate.com",
  "liam.harrison@demo.logicgate.com",
  "ava.clarke@demo.logicgate.com",
  "noah.patel@demo.logicgate.com",
  "ethan.moore@demo.logicgate.com",
  "grace.kim@demo.logicgate.com",
  "daniel.foster@demo.logicgate.com",
  // Students
  "alex.turner@demo.logicgate.com",
  "chloe.roberts@demo.logicgate.com",
  "priya.sharma@demo.logicgate.com",
  "marcus.johnson@demo.logicgate.com",
  "lily.davis@demo.logicgate.com",
  "aiden.brown@demo.logicgate.com",
  "charlotte.green@demo.logicgate.com",
  "joshua.wilson@demo.logicgate.com",
  "mia.evans@demo.logicgate.com",
  "sam.taylor@demo.logicgate.com",
  // Legacy presentation accounts (kept for safety)
  "leo.walter2008@gmail.com",
  "sarah.sylvester2006@gmail.com",
  "test-student-1@gmail.com",
  "test-tutor-1@gmail.com",
];

const deletedPaths = new Set();

async function findDemoUsers() {
  const users = [];
  for (const email of DEMO_EMAILS) {
    try {
      const user = await auth.getUserByEmail(email);
      users.push(user);
      console.log(`Found ${email}: ${user.uid}`);
    } catch {
      // Not found — skip silently
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

async function deleteDirectDoc(collection, uid) {
  const ref = db.collection(collection).doc(uid);
  const snap = await ref.get();
  if (snap.exists) await deleteRef(ref, collection);
}

async function deleteDocsByField(collection, field, uid) {
  const snap = await db.collection(collection).where(field, "==", uid).get();
  for (const doc of snap.docs) {
    await deleteRef(doc.ref, `${collection}[${field}=${uid}]`);
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
  if (DRY_RUN) console.log("=== DRY RUN — no changes will be made ===\n");

  const users = await findDemoUsers();

  if (users.length === 0) {
    console.log("\nNo demo users found. Nothing to reset.");
    return;
  }

  const unique = Array.from(new Map(users.map((u) => [u.uid, u])).values());

  for (const user of unique) {
    await resetUid(user.uid);
  }

  for (const user of unique) {
    await deleteAuthUser(user);
  }

  console.log(`\nDone. Deleted ${unique.length} accounts.`);
  console.log("Re-run seed-demo.cjs to restore demo data.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
