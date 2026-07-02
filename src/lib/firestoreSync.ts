import {
  doc, collection,
  setDoc, deleteDoc,
  getDocs, getDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Character, FeatDefinition, SpellDefinition, CustomClassDefinition } from '../types';

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

const libraryCol = (type: 'feats' | 'spells' | 'classes') => collection(db, 'library', type, 'entries');
const customClassCol  = (uid: string) => collection(db, 'users', uid, 'customClasses');
const customClassRef  = (uid: string, classId: string) => doc(db, 'users', uid, 'customClasses', classId);
const publishedClassRef = (classId: string) => doc(db, 'library', 'classes', 'entries', classId);

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

// ── Custom Classes ────────────────────────────────────────────────────────────

/** Load all draft custom classes for the given admin uid. */
export async function loadCustomClasses(uid: string): Promise<CustomClassDefinition[]> {
  const snap = await getDocs(customClassCol(uid));
  return snap.docs.map(d => d.data() as CustomClassDefinition);
}

/** Persist a draft custom class (create or overwrite). */
export async function saveCustomClass(uid: string, cls: CustomClassDefinition): Promise<void> {
  await setDoc(customClassRef(uid, cls.id), clean(cls));
}

/** Delete a draft custom class document. */
export async function deleteCustomClass(uid: string, classId: string): Promise<void> {
  await deleteDoc(customClassRef(uid, classId));
}

/**
 * Publish a custom class to library/classes/entries and mark the draft as published.
 * Both writes are independent; if the second fails the draft retains 'draft' status
 * and the user can re-publish.
 */
export async function publishCustomClass(uid: string, cls: CustomClassDefinition): Promise<void> {
  const now = Date.now();
  const published: CustomClassDefinition = { ...cls, status: 'published', publishedAt: now, updatedAt: now };
  await setDoc(publishedClassRef(cls.id), clean({ ...published, publishedBy: uid, publishedAt: serverTimestamp() }));
  await setDoc(customClassRef(uid, cls.id), clean(published));
}

/**
 * Remove a class from the shared library and revert its draft status.
 */
export async function withdrawCustomClass(uid: string, classId: string): Promise<void> {
  await deleteDoc(publishedClassRef(classId));
  const draftSnap = await getDoc(customClassRef(uid, classId));
  if (draftSnap.exists()) {
    const draft = draftSnap.data() as CustomClassDefinition;
    await setDoc(customClassRef(uid, classId), clean({ ...draft, status: 'draft', updatedAt: Date.now() }));
  }
}

/**
 * Subscribe to real-time updates on published custom classes.
 * Calls `onUpdate` whenever the collection changes.
 * Returns an unsubscribe function.
 */
export function subscribePublishedClasses(
  onUpdate: (classes: CustomClassDefinition[]) => void,
): Unsubscribe {
  return onSnapshot(libraryCol('classes'), (snap) => {
    onUpdate(snap.docs.map(d => d.data() as CustomClassDefinition));
  });
}
