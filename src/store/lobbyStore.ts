import { create } from 'zustand';
import type { Unsubscribe } from 'firebase/firestore';
import type { LobbyWithUnread, LobbyMember, LobbyMessage, Lobby, RollResultData } from '../types';
import {
  createLobby as fsCreateLobby,
  joinLobbyByCode as fsJoin,
  leaveLobby as fsLeave,
  closeLobby as fsClose,
  sendMessage as fsSend,
  updateLastSeen as fsUpdateLastSeen,
  getUserLobbies as fsGetUserLobbies,
  getMemberCharacterId as fsGetMemberCharacterId,
  setActiveCharacter as fsSetActiveCharacter,
  subscribeToMessages,
  subscribeToMembers,
} from '../lib/lobbySync';

interface LobbyState {
  lobbies: LobbyWithUnread[];
  activeLobby: Lobby | null;
  members: LobbyMember[];
  messages: LobbyMessage[];
  activeCharacterId: string | null;
  loading: boolean;
  error: string | null;

  loadUserLobbies: (uid: string) => Promise<void>;
  createLobby: (uid: string, displayName: string, name: string) => Promise<Lobby>;
  joinLobby: (uid: string, displayName: string, code: string) => Promise<Lobby>;
  leaveLobby: (uid: string, lobbyId: string) => Promise<void>;
  closeLobby: (uid: string, lobbyId: string) => Promise<void>;
  sendMessage: (uid: string, displayName: string, lobbyId: string, content: string) => Promise<void>;
  sendRollMessage: (uid: string, displayName: string, lobbyId: string, rollData: RollResultData) => Promise<void>;
  setActiveCharacter: (uid: string, charId: string | null) => Promise<void>;
  openLobby: (uid: string, lobby: Lobby) => void;
  closeLobbyView: () => void;
  clearError: () => void;
  clearStore: () => void;
}

let unsubMessages: Unsubscribe | null = null;
let unsubMembers:  Unsubscribe | null = null;

function stopSubscriptions() {
  unsubMessages?.();
  unsubMembers?.();
  unsubMessages = null;
  unsubMembers  = null;
}

export const useLobbyStore = create<LobbyState>((set, get) => ({
  lobbies:           [],
  activeLobby:       null,
  members:           [],
  messages:          [],
  activeCharacterId: null,
  loading:           false,
  error:             null,

  loadUserLobbies: async (uid) => {
    set({ loading: true, error: null });
    try {
      const lobbies = await fsGetUserLobbies(uid);
      set({ lobbies });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  createLobby: async (uid, displayName, name) => {
    set({ loading: true, error: null });
    try {
      const lobby = await fsCreateLobby(uid, displayName, name);
      await get().loadUserLobbies(uid);
      return lobby;
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  joinLobby: async (uid, displayName, code) => {
    set({ loading: true, error: null });
    try {
      const lobby = await fsJoin(uid, displayName, code);
      await get().loadUserLobbies(uid);
      return lobby;
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  leaveLobby: async (uid, lobbyId) => {
    set({ loading: true, error: null });
    try {
      await fsLeave(uid, lobbyId);
      stopSubscriptions();
      set({ activeLobby: null, members: [], messages: [], activeCharacterId: null });
      await get().loadUserLobbies(uid);
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  closeLobby: async (uid, lobbyId) => {
    set({ loading: true, error: null });
    try {
      await fsClose(uid, lobbyId);
      stopSubscriptions();
      set({ activeLobby: null, members: [], messages: [], activeCharacterId: null });
      await get().loadUserLobbies(uid);
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  sendMessage: async (uid, displayName, lobbyId, content) => {
    try {
      await fsSend(uid, displayName, lobbyId, content);
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  sendRollMessage: async (uid, displayName, lobbyId, rollData) => {
    const content = `${rollData.label}: ${rollData.formula} = ${rollData.total}`;
    // Optimistic local update before Firestore confirms
    const optimistic: LobbyMessage = {
      id:         `opt-${Date.now()}`,
      senderId:   uid,
      senderName: displayName,
      content,
      sentAt:     Date.now(),
      type:       'roll',
      rollData,
    };
    set(s => ({ messages: [...s.messages, optimistic] }));
    try {
      await fsSend(uid, displayName, lobbyId, content, rollData);
    } catch (e) {
      set(s => ({ messages: s.messages.filter(m => m.id !== optimistic.id), error: (e as Error).message }));
      throw e;
    }
  },

  setActiveCharacter: async (uid, charId) => {
    const { activeLobby } = get();
    if (!activeLobby) return;
    set({ activeCharacterId: charId });
    await fsSetActiveCharacter(uid, activeLobby.id, charId);
  },

  openLobby: (uid, lobby) => {
    stopSubscriptions();
    set({ activeLobby: lobby, messages: [], members: [], activeCharacterId: null });

    // Load initial characterId from Firestore
    fsGetMemberCharacterId(uid, lobby.id)
      .then(charId => set({ activeCharacterId: charId }))
      .catch(console.error);

    unsubMessages = subscribeToMessages(lobby.id, (msgs) => {
      set({ messages: msgs });
    });
    unsubMembers = subscribeToMembers(lobby.id, (members) => {
      set({ members });
    });

    fsUpdateLastSeen(uid, lobby.id).catch(console.error);
  },

  closeLobbyView: () => {
    stopSubscriptions();
    set({ activeLobby: null, messages: [], members: [], activeCharacterId: null });
  },

  clearError: () => set({ error: null }),

  clearStore: () => {
    stopSubscriptions();
    set({ lobbies: [], activeLobby: null, members: [], messages: [], activeCharacterId: null, loading: false, error: null });
  },
}));
