import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps } from 'firebase-admin/app';
import { writeAuditLog } from './auditLog';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

async function deleteCollection(path: string): Promise<void> {
  const snap = await db.collection(path).get();
  const chunks: FirebaseFirestore.DocumentReference[][] = [];
  for (let i = 0; i < snap.docs.length; i += 400) {
    chunks.push(snap.docs.slice(i, i + 400).map(d => d.ref));
  }
  for (const chunk of chunks) {
    const batch = db.batch();
    chunk.forEach(ref => batch.delete(ref));
    await batch.commit();
  }
}

export const deleteUserAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticazione richiesta');
  }

  const uid = request.auth.uid;

  // Delete all user subcollections
  await Promise.all([
    deleteCollection(`users/${uid}/characters`),
    deleteCollection(`users/${uid}/lobbyMemberships`),
    deleteCollection(`users/${uid}/rateLimits`),
  ]);

  // Delete remaining user documents
  const batch = db.batch();
  batch.delete(db.doc(`users/${uid}/settings/dataStore`));
  batch.delete(db.doc(`users/${uid}/profile`));
  await batch.commit();

  // Remove member docs from all lobbies the user joined
  const membershipsSnap = await db.collection(`users/${uid}/lobbyMemberships`).get();
  await Promise.all(
    membershipsSnap.docs.map(d =>
      db.doc(`lobbies/${d.id}/members/${uid}`).delete().catch(() => undefined),
    ),
  );

  // Audit log before auth deletion
  await writeAuditLog({
    action: 'account.deleted',
    performedBy: uid,
    targetId: uid,
  });

  // Hard delete from Firebase Auth
  await getAuth().deleteUser(uid);
});
