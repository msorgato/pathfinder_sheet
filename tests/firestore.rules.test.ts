/**
 * Firestore Security Rules — automated tests (tasks 9.1 and 9.2)
 *
 * Requires the Firestore Emulator to be running before executing:
 *   firebase emulators:start --only firestore
 *
 * Run tests:
 *   npm run test:rules
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { setDoc, getDoc, getDocs, doc, collection } from 'firebase/firestore';

const PROJECT_ID = 'pathfinder-sheet-test';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

async function setupAdminUser(uid: string): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', uid, 'settings', 'profile'), { role: 'admin' });
  });
}

async function setupLobby(lobbyId: string, ownerId: string): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'lobbies', lobbyId), { code: 'ABCD', ownerId, isActive: true });
    await setDoc(doc(db, 'lobbies', lobbyId, 'members', ownerId), {
      userId: ownerId,
      displayName: 'Owner',
      joinedAt: new Date(),
    });
  });
}

// ── 9.1  Library write permissions ────────────────────────────────────────────

describe('9.1 Library — write permissions', () => {
  const featData = { id: 'power-attack', name: 'Power Attack', description: 'Heavy blow' };

  it('non-admin authenticated user cannot write to library', async () => {
    const user = testEnv.authenticatedContext('user-regular');
    await assertFails(
      setDoc(doc(user.firestore(), 'library', 'feats', 'entries', 'power-attack'), featData),
    );
  });

  it('unauthenticated user cannot write to library', async () => {
    const anon = testEnv.unauthenticatedContext();
    await assertFails(
      setDoc(doc(anon.firestore(), 'library', 'feats', 'entries', 'power-attack'), featData),
    );
  });

  it('admin user can write to library', async () => {
    const adminUid = 'admin-user';
    await setupAdminUser(adminUid);
    const admin = testEnv.authenticatedContext(adminUid);
    await assertSucceeds(
      setDoc(doc(admin.firestore(), 'library', 'feats', 'entries', 'power-attack'), featData),
    );
  });

  it('anyone (even unauthenticated) can read library', async () => {
    const anon = testEnv.unauthenticatedContext();
    await assertSucceeds(
      getDocs(collection(anon.firestore(), 'library', 'feats', 'entries')),
    );
  });
});

// ── 9.2  Lobby read — join-by-code vs direct get ──────────────────────────────

describe('9.2 Lobby read — join-by-code still works', () => {
  it('authenticated non-member can list lobbies (needed for join by code)', async () => {
    await setupLobby('lobby-1', 'owner-1');
    const user = testEnv.authenticatedContext('stranger');
    await assertSucceeds(getDocs(collection(user.firestore(), 'lobbies')));
  });

  it('unauthenticated user cannot list lobbies', async () => {
    const anon = testEnv.unauthenticatedContext();
    await assertFails(getDocs(collection(anon.firestore(), 'lobbies')));
  });

  it('authenticated non-member cannot getDoc a specific lobby', async () => {
    await setupLobby('lobby-1', 'owner-1');
    const user = testEnv.authenticatedContext('stranger');
    await assertFails(getDoc(doc(user.firestore(), 'lobbies', 'lobby-1')));
  });

  it('lobby member can getDoc their lobby', async () => {
    const memberUid = 'member-1';
    await setupLobby('lobby-1', memberUid);
    const user = testEnv.authenticatedContext(memberUid);
    await assertSucceeds(getDoc(doc(user.firestore(), 'lobbies', 'lobby-1')));
  });
});
