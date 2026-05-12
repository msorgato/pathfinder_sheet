import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Lobby, LobbyMember, LobbyMessage, LobbyWithUnread } from '../types';

// ── Collection refs ───────────────────────────────────────────────────────────

const lobbiesCol     = () => collection(db, 'lobbies');
const lobbyDoc       = (id: string) => doc(db, 'lobbies', id);
const membersCol     = (id: string) => collection(db, 'lobbies', id, 'members');
const memberDoc      = (lobbyId: string, uid: string) => doc(db, 'lobbies', lobbyId, 'members', uid);
const messagesCol    = (id: string) => collection(db, 'lobbies', id, 'messages');

// User-scoped membership index: users/{uid}/lobbyMemberships/{lobbyId} → {lobbyId}
const membershipsCol = (uid: string) => collection(db, 'users', uid, 'lobbyMemberships');
const membershipDoc  = (uid: string, lobbyId: string) => doc(db, 'users', uid, 'lobbyMemberships', lobbyId);

// ── Helpers ───────────────────────────────────────────────────────────────────

function tsToMs(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof (ts as { toMillis?: unknown }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  return 0;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const snap = await getDocs(query(lobbiesCol(), where('code', '==', code), where('isActive', '==', true)));
    if (snap.empty) return code;
  }
  throw new Error('Impossibile generare un codice univoco. Riprova.');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToLobby(d: { id: string; data(): any }): Lobby {
  const data = d.data();
  return {
    id:        d.id,
    code:      data.code,
    name:      data.name,
    ownerId:   data.ownerId,
    ownerName: data.ownerName,
    createdAt: tsToMs(data.createdAt),
    isActive:  data.isActive,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToMember(d: { id: string; data(): any }): LobbyMember {
  const data = d.data();
  return {
    userId:      data.userId,
    displayName: data.displayName,
    joinedAt:    tsToMs(data.joinedAt),
    lastSeenAt:  tsToMs(data.lastSeenAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToMessage(d: { id: string; data(): any }): LobbyMessage {
  const data = d.data();
  return {
    id:         d.id,
    senderId:   data.senderId,
    senderName: data.senderName,
    content:    data.content,
    sentAt:     tsToMs(data.sentAt),
  };
}

// ── Lobby CRUD ────────────────────────────────────────────────────────────────

export async function createLobby(uid: string, displayName: string, name: string): Promise<Lobby> {
  const code = await generateUniqueCode();
  const ref = await addDoc(lobbiesCol(), {
    code,
    name:      name.trim(),
    ownerId:   uid,
    ownerName: displayName,
    createdAt: serverTimestamp(),
    isActive:  true,
  });
  const lobbyId = ref.id;

  await Promise.all([
    setDoc(memberDoc(lobbyId, uid), {
      userId:      uid,
      displayName,
      joinedAt:    serverTimestamp(),
      lastSeenAt:  serverTimestamp(),
    }),
    setDoc(membershipDoc(uid, lobbyId), { lobbyId }),
  ]);

  const snap = await getDoc(ref);
  return docToLobby(snap);
}

export async function joinLobbyByCode(uid: string, displayName: string, code: string): Promise<Lobby> {
  const snap = await getDocs(
    query(lobbiesCol(), where('code', '==', code.toUpperCase().trim()), where('isActive', '==', true)),
  );
  if (snap.empty) throw new Error('Lobby non trovata o non attiva.');

  const lobbySnap = snap.docs[0];
  const lobbyId = lobbySnap.id;
  const lobby = docToLobby(lobbySnap);

  const existing = await getDoc(memberDoc(lobbyId, uid));
  if (existing.exists()) throw new Error('Sei già membro di questa lobby.');

  await Promise.all([
    setDoc(memberDoc(lobbyId, uid), {
      userId:      uid,
      displayName,
      joinedAt:    serverTimestamp(),
      lastSeenAt:  serverTimestamp(),
    }),
    setDoc(membershipDoc(uid, lobbyId), { lobbyId }),
  ]);

  return lobby;
}

export async function leaveLobby(uid: string, lobbyId: string): Promise<void> {
  const snap = await getDoc(lobbyDoc(lobbyId));
  if (!snap.exists()) throw new Error('Lobby non trovata.');
  const lobby = docToLobby(snap);
  if (lobby.ownerId === uid) throw new Error('Sei il proprietario della lobby. Chiudila prima di abbandonarla.');
  await Promise.all([
    deleteDoc(memberDoc(lobbyId, uid)),
    deleteDoc(membershipDoc(uid, lobbyId)),
  ]);
}

export async function closeLobby(uid: string, lobbyId: string): Promise<void> {
  const snap = await getDoc(lobbyDoc(lobbyId));
  if (!snap.exists()) throw new Error('Lobby non trovata.');
  const lobby = docToLobby(snap);
  if (lobby.ownerId !== uid) throw new Error('Solo il proprietario può chiudere la lobby.');
  await updateDoc(lobbyDoc(lobbyId), { isActive: false });
}

export async function getLobbyMembers(uid: string, lobbyId: string): Promise<LobbyMember[]> {
  const mSnap = await getDoc(memberDoc(lobbyId, uid));
  if (!mSnap.exists()) throw new Error('Non sei membro di questa lobby.');
  const snap = await getDocs(membersCol(lobbyId));
  return snap.docs.map(docToMember);
}

// ── Messages ──────────────────────────────────────────────────────────────────

export async function sendMessage(uid: string, displayName: string, lobbyId: string, content: string): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Il messaggio non può essere vuoto.');

  const [lobbySnap, mSnap] = await Promise.all([
    getDoc(lobbyDoc(lobbyId)),
    getDoc(memberDoc(lobbyId, uid)),
  ]);
  if (!lobbySnap.exists()) throw new Error('Lobby non trovata.');
  if (!docToLobby(lobbySnap).isActive) throw new Error('La lobby non è attiva.');
  if (!mSnap.exists()) throw new Error('Non sei membro di questa lobby.');

  await addDoc(messagesCol(lobbyId), {
    senderId:   uid,
    senderName: displayName,
    content:    trimmed,
    sentAt:     serverTimestamp(),
  });
}

export async function getMessagesAfter(
  uid: string,
  lobbyId: string,
  after?: number,
  pageLimit = 50,
): Promise<LobbyMessage[]> {
  const mSnap = await getDoc(memberDoc(lobbyId, uid));
  if (!mSnap.exists()) throw new Error('Non sei membro di questa lobby.');

  let q = query(messagesCol(lobbyId), orderBy('sentAt', 'asc'), limit(pageLimit));
  if (after) {
    q = query(messagesCol(lobbyId), orderBy('sentAt', 'asc'), startAfter(Timestamp.fromMillis(after)), limit(pageLimit));
  }
  const snap = await getDocs(q);
  return snap.docs.map(docToMessage);
}

export async function updateLastSeen(uid: string, lobbyId: string): Promise<void> {
  const mSnap = await getDoc(memberDoc(lobbyId, uid));
  if (!mSnap.exists()) return;
  await updateDoc(memberDoc(lobbyId, uid), { lastSeenAt: serverTimestamp() });
}

// ── User lobbies with unread count ────────────────────────────────────────────

export async function getUserLobbies(uid: string): Promise<LobbyWithUnread[]> {
  // 1. List all lobby IDs the user belongs to (from their membership index)
  const membershipSnap = await getDocs(membershipsCol(uid));
  if (membershipSnap.empty) return [];

  const lobbyIds = membershipSnap.docs.map(d => d.id);

  // 2. Fetch each lobby + member doc + unread count in parallel
  const results = await Promise.all(
    lobbyIds.map(async (lobbyId) => {
      const [lobbySnap, mSnap, allMembersSnap] = await Promise.all([
        getDoc(lobbyDoc(lobbyId)),
        getDoc(memberDoc(lobbyId, uid)),
        getDocs(membersCol(lobbyId)),
      ]);
      if (!lobbySnap.exists() || !mSnap.exists()) return null;

      const lobby = docToLobby(lobbySnap);
      const member = docToMember(mSnap);
      const memberCount = allMembersSnap.size;

      let unreadCount = 0;
      if (member.lastSeenAt) {
        const unreadSnap = await getDocs(
          query(messagesCol(lobbyId), where('sentAt', '>', Timestamp.fromMillis(member.lastSeenAt))),
        );
        unreadCount = unreadSnap.size;
      }
      return { ...lobby, unreadCount, memberCount };
    }),
  );

  return results.filter((r): r is LobbyWithUnread => r !== null);
}

// ── Real-time subscriptions ───────────────────────────────────────────────────

export function subscribeToMessages(
  lobbyId: string,
  onMessages: (msgs: LobbyMessage[]) => void,
): Unsubscribe {
  const q = query(messagesCol(lobbyId), orderBy('sentAt', 'asc'), limit(100));
  return onSnapshot(q, (snap) => {
    onMessages(snap.docs.map(docToMessage));
  });
}

export function subscribeToMembers(
  lobbyId: string,
  onMembers: (members: LobbyMember[]) => void,
): Unsubscribe {
  return onSnapshot(membersCol(lobbyId), (snap) => {
    onMembers(snap.docs.map(docToMember));
  });
}
