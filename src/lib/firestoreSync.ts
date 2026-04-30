import {
  doc, collection,
  setDoc, deleteDoc,
  getDocs, getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Character } from '../types';

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
