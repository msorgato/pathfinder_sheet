import {
  doc, collection,
  setDoc, deleteDoc,
  getDocs, getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Character, FeatDefinition, SpellDefinition } from '../types';

const charCol    = (uid: string) => collection(db, 'users', uid, 'characters');
const charDocRef = (uid: string, charId: string) => doc(db, 'users', uid, 'characters', charId);
const dataDocRef = (uid: string) => doc(db, 'users', uid, 'settings', 'dataStore');

// Firestore rejects documents containing `undefined` values.
// JSON round-trip is the simplest way to strip them all recursively.
function clean<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export async function saveCharacter(uid: string, char: Character): Promise<void> {
  await setDoc(charDocRef(uid, char.id), clean(char));
}

export async function deleteCharacterDoc(uid: string, charId: string): Promise<void> {
  await deleteDoc(charDocRef(uid, charId));
}

export async function loadCharacters(uid: string): Promise<Character[]> {
  const snap = await getDocs(charCol(uid));
  return snap.docs.map(d => d.data() as Character);
}

export async function saveDataStore(uid: string, data: object): Promise<void> {
  await setDoc(dataDocRef(uid), clean(data));
}

export async function loadDataStore(uid: string): Promise<Record<string, unknown> | null> {
  const snap = await getDoc(dataDocRef(uid));
  return snap.exists() ? (snap.data() as Record<string, unknown>) : null;
}

export interface UserExport {
  exportedAt: string;
  uid: string;
  profile: Record<string, unknown> | null;
  characters: unknown[];
  dataStore: Record<string, unknown> | null;
  lobbyMemberships: Array<{ lobbyId: string; displayName: string; joinedAt: string | null }>;
}

function tsToIso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return null;
}

export async function exportUserData(uid: string): Promise<UserExport> {
  const [profileSnap, charsSnap, dataSnap, membershipsSnap] = await Promise.all([
    getDoc(doc(db, 'users', uid, 'profile')),
    getDocs(collection(db, 'users', uid, 'characters')),
    getDoc(doc(db, 'users', uid, 'settings', 'dataStore')),
    getDocs(collection(db, 'users', uid, 'lobbyMemberships')),
  ]);

  const lobbyIds = membershipsSnap.docs.map(d => d.id);
  const memberSnaps = await Promise.all(
    lobbyIds.map(lobbyId => getDoc(doc(db, 'lobbies', lobbyId, 'members', uid))),
  );

  return {
    exportedAt: new Date().toISOString(),
    uid,
    profile: profileSnap.exists() ? profileSnap.data() as Record<string, unknown> : null,
    characters: charsSnap.docs.map(d => d.data()),
    dataStore: dataSnap.exists() ? dataSnap.data() as Record<string, unknown> : null,
    lobbyMemberships: memberSnaps.map((snap, i) => ({
      lobbyId: lobbyIds[i],
      displayName: (snap.data()?.displayName as string) ?? '',
      joinedAt: tsToIso(snap.data()?.joinedAt),
    })),
  };
}

const libraryCol = (type: 'feats' | 'spells') => collection(db, 'library', type, 'entries');

export async function publishToLibrary(
  type: 'feat' | 'spell',
  entry: FeatDefinition | SpellDefinition,
  publishedBy: string,
): Promise<void> {
  const col = type === 'feat' ? 'feats' : 'spells';
  await setDoc(doc(db, 'library', col, 'entries', entry.id), clean({ ...entry, publishedBy, publishedAt: serverTimestamp() }));
}

export async function loadLibrary(): Promise<{ feats: FeatDefinition[]; spells: SpellDefinition[] }> {
  const [featsSnap, spellsSnap] = await Promise.all([
    getDocs(libraryCol('feats')),
    getDocs(libraryCol('spells')),
  ]);
  return {
    feats:  featsSnap.docs.map(d => d.data() as FeatDefinition),
    spells: spellsSnap.docs.map(d => d.data() as SpellDefinition),
  };
}
