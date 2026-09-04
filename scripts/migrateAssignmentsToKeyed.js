/**
 * One-time migration: converts Firebase RTDB's /ASSIGNMENTS node from a
 * plain JSON array (index-keyed) to an object keyed by assignment.id,
 * matching the convention already used by /CONTACTS and /VISITS.
 *
 * Why: relying on array position to address a specific assignment is
 * fragile — Firebase's own docs warn against it, since removing/reordering
 * any entry shifts every later index and can misdirect a write meant for
 * one job onto another.
 *
 * Usage:
 *   EMAIL=you@example.com PASSWORD=yourpassword node scripts/migrateAssignmentsToKeyed.js
 *   EMAIL=... PASSWORD=... node scripts/migrateAssignmentsToKeyed.js --apply
 *
 * Without --apply this only prints what WOULD change (dry run) and writes
 * a timestamped local backup of the current /ASSIGNMENTS data. Pass
 * --apply to actually overwrite the database after reviewing the dry run.
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const APPLY = process.argv.includes("--apply");
const API_URL = "https://crewloop-9564f-default-rtdb.firebaseio.com";
const API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const ID_TOKEN = process.env.ID_TOKEN;

async function signIn() {
  if (ID_TOKEN) return ID_TOKEN;
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      "Provide EMAIL and PASSWORD env vars (or ID_TOKEN directly) to authenticate.",
    );
  }
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
        returnSecureToken: true,
      }),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `Sign-in failed: ${data.error?.message || response.statusText}`,
    );
  }
  return data.idToken;
}

async function main() {
  if (!API_KEY) {
    throw new Error("EXPO_PUBLIC_FIREBASE_API_KEY is not set in the environment.");
  }

  const idToken = await signIn();

  const getResponse = await fetch(
    `${API_URL}/ASSIGNMENTS.json?auth=${idToken}`,
  );
  const current = await getResponse.json();
  if (!getResponse.ok) {
    throw new Error(`Failed to read /ASSIGNMENTS: ${getResponse.statusText}`);
  }

  if (current == null) {
    console.log("/ASSIGNMENTS is empty — nothing to migrate.");
    return;
  }

  if (!Array.isArray(current)) {
    console.log(
      "/ASSIGNMENTS is already an object (not an array) — nothing to migrate.",
    );
    return;
  }

  const backupPath = path.join(
    __dirname,
    `assignments-backup-${Date.now()}.json`,
  );
  fs.writeFileSync(backupPath, JSON.stringify(current, null, 2));
  console.log(`Backed up current /ASSIGNMENTS to ${backupPath}`);

  const keyed = {};
  const skipped = [];
  for (const item of current) {
    const id = item?.assignment?.id;
    if (id == null) {
      skipped.push(item);
      continue;
    }
    if (keyed[id]) {
      throw new Error(
        `Duplicate assignment id ${id} found — aborting before writing anything.`,
      );
    }
    keyed[id] = item;
  }

  console.log(
    `Converted ${Object.keys(keyed).length} assignment(s) from array to keyed object.`,
  );
  if (skipped.length) {
    console.log(
      `WARNING: ${skipped.length} item(s) had no assignment.id and were dropped:`,
      skipped,
    );
  }

  if (!APPLY) {
    console.log("\nDry run only — no changes written. Re-run with --apply to write this to Firebase.");
    console.log("Preview of new keys:", Object.keys(keyed));
    return;
  }

  const putResponse = await fetch(
    `${API_URL}/ASSIGNMENTS.json?auth=${idToken}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(keyed),
    },
  );
  if (!putResponse.ok) {
    const errBody = await putResponse.text();
    throw new Error(`Failed to write /ASSIGNMENTS: ${putResponse.statusText} — ${errBody}`);
  }

  console.log("/ASSIGNMENTS successfully migrated to id-keyed object.");
}

main().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
