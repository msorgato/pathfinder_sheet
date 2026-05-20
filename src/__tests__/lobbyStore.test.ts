import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const {
  mockFsTransferGMRole,
  mockSubscribeToMessages,
  mockSubscribeToMembers,
  mockFsUpdateLastSeen,
  mockFsGetMemberCharacterId,
} = vi.hoisted(() => ({
  mockFsTransferGMRole:      vi.fn(),
  mockSubscribeToMessages:   vi.fn(),
  mockSubscribeToMembers:    vi.fn(),
  mockFsUpdateLastSeen:      vi.fn(),
  mockFsGetMemberCharacterId: vi.fn(),
}));

vi.mock('../lib/lobbySync', () => ({
  createLobby:            vi.fn(),
  joinLobbyByCode:        vi.fn(),
  leaveLobby:             vi.fn(),
  closeLobby:             vi.fn(),
  sendMessage:            vi.fn(),
  updateLastSeen:         mockFsUpdateLastSeen,
  getUserLobbies:         vi.fn(() => Promise.resolve([])),
  getMemberCharacterId:   mockFsGetMemberCharacterId,
  setActiveCharacter:     vi.fn(),
  transferGMRole:         mockFsTransferGMRole,
  subscribeToMessages:    mockSubscribeToMessages,
  subscribeToMembers:     mockSubscribeToMembers,
}));

// ── Import dopo i mock ────────────────────────────────────────────────────────

import { useLobbyStore } from '../store/lobbyStore';
import type { Lobby, LobbyMessage } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeLobby(overrides: Partial<Lobby> = {}): Lobby {
  return {
    id: 'lobby-1', code: 'ABC123', name: 'Test', ownerId: 'owner-uid',
    ownerName: 'Owner', createdAt: 1000, isActive: true, gmUid: 'gm-uid', ...overrides,
  };
}

function makeMsg(id: string, overrides: Partial<LobbyMessage> = {}): LobbyMessage {
  return {
    id, senderId: 'user-1', senderName: 'User', content: 'Ciao', sentAt: 1000, type: 'text', ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('lobbyStore — isHiddenRollEnabled / toggleHiddenRoll', () => {
  beforeEach(() => {
    useLobbyStore.getState().clearStore();
    vi.clearAllMocks();
  });

  it('inizia con isHiddenRollEnabled false', () => {
    expect(useLobbyStore.getState().isHiddenRollEnabled).toBe(false);
  });

  it('toggleHiddenRoll lo porta a true e poi di nuovo a false', () => {
    useLobbyStore.getState().toggleHiddenRoll();
    expect(useLobbyStore.getState().isHiddenRollEnabled).toBe(true);
    useLobbyStore.getState().toggleHiddenRoll();
    expect(useLobbyStore.getState().isHiddenRollEnabled).toBe(false);
  });

  it('isHiddenRollEnabled viene resettato a false alla chiusura della lobby', () => {
    useLobbyStore.getState().toggleHiddenRoll();
    expect(useLobbyStore.getState().isHiddenRollEnabled).toBe(true);
    useLobbyStore.getState().closeLobbyView();
    expect(useLobbyStore.getState().isHiddenRollEnabled).toBe(false);
  });
});

describe('lobbyStore — filtro messaggi nascosti in openLobby', () => {
  let capturedCallback: ((msgs: LobbyMessage[]) => void) | null = null;

  beforeEach(() => {
    useLobbyStore.getState().clearStore();
    vi.clearAllMocks();

    mockFsGetMemberCharacterId.mockResolvedValue(null);
    mockFsUpdateLastSeen.mockResolvedValue(undefined);
    mockSubscribeToMembers.mockReturnValue(vi.fn());
    mockSubscribeToMessages.mockImplementation((_lobbyId: string, cb: (msgs: LobbyMessage[]) => void) => {
      capturedCallback = cb;
      return vi.fn();
    });
  });

  afterEach(() => {
    capturedCallback = null;
  });

  it('i messaggi nascosti altrui vengono filtrati per i non-GM', () => {
    const lobby = makeLobby({ gmUid: 'gm-uid' });
    useLobbyStore.getState().openLobby('player-uid', lobby);

    const msgs = [
      makeMsg('1'),
      makeMsg('2', { senderId: 'gm-uid', hidden: true, type: 'roll' }),
      makeMsg('3', { senderId: 'player-uid' }),
    ];
    capturedCallback!(msgs);

    const stored = useLobbyStore.getState().messages;
    expect(stored).toHaveLength(2);
    expect(stored.find(m => m.id === '2')).toBeUndefined();
  });

  it('il GM vede i propri messaggi nascosti', () => {
    const lobby = makeLobby({ gmUid: 'gm-uid' });
    useLobbyStore.getState().openLobby('gm-uid', lobby);

    const msgs = [
      makeMsg('1'),
      makeMsg('2', { senderId: 'gm-uid', hidden: true, type: 'roll' }),
    ];
    capturedCallback!(msgs);

    const stored = useLobbyStore.getState().messages;
    expect(stored).toHaveLength(2);
    expect(stored.find(m => m.id === '2')).toBeDefined();
  });

  it('i messaggi normali (hidden assente) sono visibili a tutti', () => {
    const lobby = makeLobby({ gmUid: 'gm-uid' });
    useLobbyStore.getState().openLobby('player-uid', lobby);

    const msgs = [makeMsg('1'), makeMsg('2', { senderId: 'gm-uid' })];
    capturedCallback!(msgs);

    expect(useLobbyStore.getState().messages).toHaveLength(2);
  });
});

describe('lobbyStore — transferGMRole', () => {
  beforeEach(() => {
    useLobbyStore.getState().clearStore();
    vi.clearAllMocks();

    mockFsGetMemberCharacterId.mockResolvedValue(null);
    mockFsUpdateLastSeen.mockResolvedValue(undefined);
    mockSubscribeToMembers.mockReturnValue(vi.fn());
    mockSubscribeToMessages.mockReturnValue(vi.fn());
  });

  it('aggiorna gmUid in activeLobby dopo il trasferimento', async () => {
    const lobby = makeLobby({ gmUid: 'gm-uid' });
    useLobbyStore.getState().openLobby('gm-uid', lobby);

    mockFsTransferGMRole.mockResolvedValue(undefined);
    await useLobbyStore.getState().transferGMRole('gm-uid', 'lobby-1', 'new-gm-uid');

    expect(useLobbyStore.getState().activeLobby?.gmUid).toBe('new-gm-uid');
    expect(mockFsTransferGMRole).toHaveBeenCalledWith('gm-uid', 'lobby-1', 'new-gm-uid');
  });

  it('imposta error se il trasferimento fallisce', async () => {
    const lobby = makeLobby({ gmUid: 'gm-uid' });
    useLobbyStore.getState().openLobby('gm-uid', lobby);

    mockFsTransferGMRole.mockRejectedValue(new Error('Non sei il GM'));
    await expect(
      useLobbyStore.getState().transferGMRole('other-uid', 'lobby-1', 'target-uid'),
    ).rejects.toThrow();

    expect(useLobbyStore.getState().error).toBe('Non sei il GM');
    expect(useLobbyStore.getState().activeLobby?.gmUid).toBe('gm-uid');
  });
});
