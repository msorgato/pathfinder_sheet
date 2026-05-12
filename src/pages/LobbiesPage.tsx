import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLobbyStore } from '../store/lobbyStore';
import { CreateLobbyModal } from '../components/lobby/CreateLobbyModal';
import { JoinLobbyModal } from '../components/lobby/JoinLobbyModal';
import type { LobbyWithUnread } from '../types';

export function LobbiesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { lobbies, loading, error, loadUserLobbies, createLobby, joinLobby, openLobby, clearError } = useLobbyStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const uid = user?.uid ?? '';
  const displayName = user?.displayName ?? user?.email ?? 'Utente';

  useEffect(() => {
    if (uid) loadUserLobbies(uid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const handleCreate = async (name: string) => {
    const lobby = await createLobby(uid, displayName, name);
    setShowCreate(false);
    openLobby(uid, lobby);
    navigate(`/lobbies/${lobby.id}`);
  };

  const handleJoin = async (code: string) => {
    const lobby = await joinLobby(uid, displayName, code);
    setShowJoin(false);
    openLobby(uid, lobby);
    navigate(`/lobbies/${lobby.id}`);
  };

  const openExisting = (lobby: LobbyWithUnread) => {
    openLobby(uid, lobby);
    navigate(`/lobbies/${lobby.id}`);
  };

  const totalUnread = lobbies.reduce((s, l) => s + l.unreadCount, 0);

  return (
    <div className="min-h-screen theme-root" style={{ background: 'var(--theme-bg)' }}>
      {/* Header */}
      <div className="pf-header px-6 py-6">
        <button
          className="absolute top-4 left-4 pf-btn pf-btn-ghost text-sm px-3 py-1"
          onClick={() => navigate('/')}
        >
          ← Home
        </button>
        <h1
          className="text-3xl font-bold text-center"
          style={{ color: 'var(--theme-accent)', fontFamily: 'var(--theme-font)' }}
        >
          ⚔ Lobby
        </h1>
        <p className="text-center text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Spazi condivisi per il tuo gruppo di gioco
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button
            className="pf-btn pf-btn-gold flex-1 py-3 text-sm font-semibold"
            onClick={() => setShowCreate(true)}
          >
            + Crea lobby
          </button>
          <button
            className="pf-btn pf-btn-outline flex-1 py-3 text-sm font-semibold"
            onClick={() => setShowJoin(true)}
          >
            Unisciti con codice
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="pf-panel px-4 py-3 mb-4 text-sm"
            style={{ borderColor: 'var(--theme-hp-low)', color: 'var(--theme-hp-low)' }}
          >
            {error}
            <button className="ml-2 underline text-xs" onClick={clearError}>Chiudi</button>
          </div>
        )}

        {/* Summary */}
        {lobbies.length > 0 && totalUnread > 0 && (
          <p className="text-xs mb-3" style={{ color: 'var(--theme-accent)' }}>
            {totalUnread} messaggio{totalUnread !== 1 ? 'i' : ''} non letti
          </p>
        )}

        {/* Lobby list */}
        {loading && (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            Caricamento…
          </p>
        )}

        {!loading && lobbies.length === 0 && (
          <div className="pf-panel p-8 text-center">
            <div className="text-4xl mb-3">🏰</div>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              Non sei ancora in nessuna lobby.
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--theme-text-faint)' }}>
              Creane una o unisciti con un codice.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {lobbies.map(lobby => (
            <div
              key={lobby.id}
              className="pf-panel p-4 cursor-pointer"
              style={{ transition: 'border-color 0.2s, transform 0.15s' }}
              onClick={() => openExisting(lobby)}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--theme-accent)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateX(2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '';
                (e.currentTarget as HTMLDivElement).style.transform = '';
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className="text-base font-bold truncate"
                      style={{ color: 'var(--theme-accent)' }}
                    >
                      {lobby.name}
                    </h3>
                    {!lobby.isActive && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded shrink-0"
                        style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--theme-hp-low)', border: '1px solid var(--theme-hp-low)' }}
                      >
                        Chiusa
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                    Codice: <span className="font-mono font-bold">{lobby.code}</span>
                    {' · '}{lobby.memberCount} membro{lobby.memberCount !== 1 ? 'i' : ''}
                    {' · '}{lobby.ownerId === uid ? 'Owner' : `Owner: ${lobby.ownerName}`}
                  </p>
                </div>
                {lobby.unreadCount > 0 && (
                  <span
                    className="shrink-0 text-xs font-bold px-2 py-1 rounded-full"
                    style={{ background: 'var(--theme-accent)', color: 'var(--theme-bg)' }}
                  >
                    {lobby.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <CreateLobbyModal onConfirm={handleCreate} onCancel={() => setShowCreate(false)} />
      )}
      {showJoin && (
        <JoinLobbyModal onConfirm={handleJoin} onCancel={() => setShowJoin(false)} />
      )}
    </div>
  );
}
