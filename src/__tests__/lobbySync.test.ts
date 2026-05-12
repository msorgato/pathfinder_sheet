import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks dichiarati con vi.hoisted (risolve il problema di hoisting) ─────────

const {
  mockGetDoc, mockGetDocs, mockAddDoc, mockSetDoc,
  mockUpdateDoc, mockDeleteDoc,
} = vi.hoisted(() => ({
  mockGetDoc:    vi.fn(),
  mockGetDocs:   vi.fn(),
  mockAddDoc:    vi.fn(),
  mockSetDoc:    vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection:      vi.fn(() => ({})),
  doc:             vi.fn(() => ({})),
  addDoc:          mockAddDoc,
  setDoc:          mockSetDoc,
  updateDoc:       mockUpdateDoc,
  deleteDoc:       mockDeleteDoc,
  getDoc:          mockGetDoc,
  getDocs:         mockGetDocs,
  query:           vi.fn(() => ({})),
  where:           vi.fn(() => ({})),
  orderBy:         vi.fn(() => ({})),
  limit:           vi.fn(() => ({})),
  startAfter:      vi.fn(() => ({})),
  serverTimestamp: vi.fn(() => ({ toMillis: () => Date.now() })),
  Timestamp:       { fromMillis: vi.fn((ms: number) => ({ toMillis: () => ms })) },
  onSnapshot:      vi.fn(() => vi.fn()),
}));

vi.mock('../lib/firebase', () => ({ db: {} }));

// ── Import dopo i mock ────────────────────────────────────────────────────────

import {
  createLobby,
  joinLobbyByCode,
  leaveLobby,
  closeLobby,
  getLobbyMembers,
  sendMessage,
  getMessagesAfter,
  updateLastSeen,
} from '../lib/lobbySync';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeLobbySnap(id: string, overrides: Record<string, unknown> = {}) {
  const data = {
    code: 'ABC123', name: 'Test Lobby', ownerId: 'owner-uid', ownerName: 'Owner',
    createdAt: { toMillis: () => 1000 }, isActive: true, ...overrides,
  };
  return { exists: () => true, id, data: () => data };
}

function makeMemberSnap(uid: string) {
  return {
    exists: () => true, id: uid,
    data: () => ({
      userId: uid, displayName: 'User',
      joinedAt: { toMillis: () => 1000 }, lastSeenAt: { toMillis: () => 1000 },
    }),
  };
}

function makeMessageSnap(id: string, overrides: Record<string, unknown> = {}) {
  return {
    exists: () => true,
    id,
    data: () => ({
      senderId: 'sender-uid', senderName: 'Sender', content: 'Ciao!',
      sentAt: { toMillis: () => 2000 }, ...overrides,
    }),
  };
}

const emptySnap   = () => ({ empty: true, docs: [], size: 0 });
const querySnap   = (docs: ReturnType<typeof makeLobbySnap | typeof makeMemberSnap>[]) =>
  ({ empty: docs.length === 0, docs, size: docs.length });

// ── 6.1: Creazione e partecipazione lobby ─────────────────────────────────────

describe('6.1 — createLobby', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('crea la lobby e aggiunge l\'owner come membro', async () => {
    mockGetDocs.mockResolvedValue(emptySnap()); // nessuna collisione codice
    mockAddDoc.mockResolvedValue({ id: 'lobby-1' });
    mockSetDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue(makeLobbySnap('lobby-1'));

    const lobby = await createLobby('owner-uid', 'Owner', 'Avventura del Drago');

    expect(mockAddDoc).toHaveBeenCalledOnce();
    expect(mockSetDoc).toHaveBeenCalledTimes(2); // member + membership
    expect(lobby.id).toBe('lobby-1');
    expect(lobby.name).toBe('Test Lobby');
  });
});

describe('6.1 — joinLobbyByCode', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('aggiunge l\'utente alla lobby trovata tramite codice', async () => {
    mockGetDocs.mockResolvedValue(querySnap([makeLobbySnap('lobby-1')]));
    mockGetDoc.mockResolvedValueOnce({ exists: () => false }); // non già membro
    mockSetDoc.mockResolvedValue(undefined);

    const lobby = await joinLobbyByCode('new-uid', 'Nuovo', 'ABC123');

    expect(mockSetDoc).toHaveBeenCalledTimes(2); // member + membership
    expect(lobby.id).toBe('lobby-1');
  });

  it('lancia errore se il codice non corrisponde a nessuna lobby attiva', async () => {
    mockGetDocs.mockResolvedValue(emptySnap());

    await expect(joinLobbyByCode('new-uid', 'Nuovo', 'XXXXXX'))
      .rejects.toThrow('Lobby non trovata');
  });

  it('lancia errore se l\'utente è già membro', async () => {
    mockGetDocs.mockResolvedValue(querySnap([makeLobbySnap('lobby-1')]));
    mockGetDoc.mockResolvedValueOnce(makeMemberSnap('new-uid')); // già esiste

    await expect(joinLobbyByCode('new-uid', 'Nuovo', 'ABC123'))
      .rejects.toThrow('già membro');
  });
});

// ── 6.2: Messaggistica ────────────────────────────────────────────────────────

describe('6.2 — sendMessage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('persiste il messaggio se lobby attiva e utente membro', async () => {
    mockGetDoc
      .mockResolvedValueOnce(makeLobbySnap('lobby-1'))
      .mockResolvedValueOnce(makeMemberSnap('user-uid'));
    mockAddDoc.mockResolvedValue({ id: 'msg-1' });

    await sendMessage('user-uid', 'User', 'lobby-1', 'Ciao!');

    expect(mockAddDoc).toHaveBeenCalledOnce();
    const arg = mockAddDoc.mock.calls[0][1] as { content: string };
    expect(arg.content).toBe('Ciao!');
  });

  it('lancia errore se il contenuto è vuoto o solo spazi', async () => {
    await expect(sendMessage('user-uid', 'User', 'lobby-1', '   '))
      .rejects.toThrow('vuoto');
    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it('lancia errore se la lobby non è attiva', async () => {
    mockGetDoc
      .mockResolvedValueOnce(makeLobbySnap('lobby-1', { isActive: false }))
      .mockResolvedValueOnce(makeMemberSnap('user-uid'));

    await expect(sendMessage('user-uid', 'User', 'lobby-1', 'Ciao'))
      .rejects.toThrow('non è attiva');
    expect(mockAddDoc).not.toHaveBeenCalled();
  });
});

describe('6.2 — getMessagesAfter', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('restituisce i messaggi in ordine ai membri', async () => {
    mockGetDoc.mockResolvedValue(makeMemberSnap('user-uid'));
    mockGetDocs.mockResolvedValue(querySnap([
      makeMessageSnap('msg-1', { sentAt: { toMillis: () => 1000 } }),
      makeMessageSnap('msg-2', { sentAt: { toMillis: () => 2000 } }),
    ]));

    const messages = await getMessagesAfter('user-uid', 'lobby-1');

    expect(messages).toHaveLength(2);
    expect(messages[0].id).toBe('msg-1');
    expect(messages[1].id).toBe('msg-2');
  });

  it('restituisce lista vuota se non ci sono messaggi dopo il cursor', async () => {
    mockGetDoc.mockResolvedValue(makeMemberSnap('user-uid'));
    mockGetDocs.mockResolvedValue(querySnap([]));

    const messages = await getMessagesAfter('user-uid', 'lobby-1', 9_999_999);

    expect(messages).toHaveLength(0);
  });
});

describe('6.2 — updateLastSeen', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('aggiorna lastSeenAt se il membro esiste', async () => {
    mockGetDoc.mockResolvedValue(makeMemberSnap('user-uid'));
    mockUpdateDoc.mockResolvedValue(undefined);

    await updateLastSeen('user-uid', 'lobby-1');

    expect(mockUpdateDoc).toHaveBeenCalledOnce();
  });

  it('non fa nulla se il documento membro non esiste', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await updateLastSeen('user-uid', 'lobby-1');

    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});

// ── 6.3: Autorizzazione ───────────────────────────────────────────────────────

describe('6.3 — leaveLobby', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('rimuove il membro non-owner', async () => {
    mockGetDoc.mockResolvedValue(makeLobbySnap('lobby-1', { ownerId: 'owner-uid' }));
    mockDeleteDoc.mockResolvedValue(undefined);

    await leaveLobby('other-uid', 'lobby-1');

    expect(mockDeleteDoc).toHaveBeenCalledTimes(2); // member + membership
  });

  it('blocca l\'owner che tenta di abbandonare senza chiudere', async () => {
    mockGetDoc.mockResolvedValue(makeLobbySnap('lobby-1', { ownerId: 'owner-uid' }));

    await expect(leaveLobby('owner-uid', 'lobby-1'))
      .rejects.toThrow('proprietario');
    expect(mockDeleteDoc).not.toHaveBeenCalled();
  });
});

describe('6.3 — closeLobby', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('permette all\'owner di chiudere la lobby', async () => {
    mockGetDoc.mockResolvedValue(makeLobbySnap('lobby-1', { ownerId: 'owner-uid' }));
    mockUpdateDoc.mockResolvedValue(undefined);

    await closeLobby('owner-uid', 'lobby-1');

    expect(mockUpdateDoc).toHaveBeenCalledOnce();
  });

  it('blocca un non-owner che tenta di chiudere', async () => {
    mockGetDoc.mockResolvedValue(makeLobbySnap('lobby-1', { ownerId: 'owner-uid' }));

    await expect(closeLobby('other-uid', 'lobby-1'))
      .rejects.toThrow('Solo il proprietario');
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});

describe('6.3 — getLobbyMembers', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('restituisce i membri se il richiedente è membro', async () => {
    mockGetDoc.mockResolvedValue(makeMemberSnap('user-uid'));
    mockGetDocs.mockResolvedValue(querySnap([
      makeMemberSnap('owner-uid'),
      makeMemberSnap('user-uid'),
    ]));

    const members = await getLobbyMembers('user-uid', 'lobby-1');

    expect(members).toHaveLength(2);
  });

  it('blocca un non-membro che tenta di vedere i partecipanti', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await expect(getLobbyMembers('stranger-uid', 'lobby-1'))
      .rejects.toThrow('Non sei membro');
  });
});

describe('6.3 — sendMessage da non-membro', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('blocca l\'invio da parte di un non-membro', async () => {
    mockGetDoc
      .mockResolvedValueOnce(makeLobbySnap('lobby-1'))
      .mockResolvedValueOnce({ exists: () => false }); // non membro

    await expect(sendMessage('stranger', 'Stranger', 'lobby-1', 'Ciao'))
      .rejects.toThrow('Non sei membro');
    expect(mockAddDoc).not.toHaveBeenCalled();
  });
});
