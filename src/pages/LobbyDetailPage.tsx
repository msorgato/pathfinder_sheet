import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLobbyStore } from '../store/lobbyStore';
import { ChatPanel } from '../components/lobby/ChatPanel';
import { MembersList } from '../components/lobby/MembersList';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { getUserLobbies } from '../lib/lobbySync';

export function LobbyDetailPage() {
  const { id: lobbyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    activeLobby,
    members,
    messages,
    loading,
    error,
    openLobby,
    closeLobbyView,
    leaveLobby,
    closeLobby,
    sendMessage,
    clearError,
  } = useLobbyStore();

  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [loadingLobby, setLoadingLobby] = useState(false);

  const uid = user?.uid ?? '';
  const displayName = user?.displayName ?? user?.email ?? 'Utente';

  // If we navigated here directly (e.g. refresh), load the lobby from Firestore
  useEffect(() => {
    if (!lobbyId || !uid) return;
    if (activeLobby?.id === lobbyId) return; // already open

    setLoadingLobby(true);
    getUserLobbies(uid)
      .then(lobbies => {
        const found = lobbies.find(l => l.id === lobbyId);
        if (found) {
          openLobby(uid, found);
        } else {
          navigate('/lobbies', { replace: true });
        }
      })
      .catch(() => navigate('/lobbies', { replace: true }))
      .finally(() => setLoadingLobby(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyId, uid]);

  const goBack = () => {
    closeLobbyView();
    navigate('/lobbies');
  };

  const handleLeave = async () => {
    await leaveLobby(uid, lobbyId!);
    navigate('/lobbies');
  };

  const handleClose = async () => {
    await closeLobby(uid, lobbyId!);
    navigate('/lobbies');
  };

  const handleSend = async (content: string) => {
    await sendMessage(uid, displayName, lobbyId!, content);
  };

  const isOwner = activeLobby?.ownerId === uid;

  if (loadingLobby || (!activeLobby && loading)) {
    return (
      <div className="min-h-screen theme-root flex items-center justify-center" style={{ background: 'var(--theme-bg)' }}>
        <div className="anim-spin text-4xl" style={{ color: 'var(--theme-accent)' }}>✦</div>
      </div>
    );
  }

  if (!activeLobby) return null;

  return (
    <div
      className="min-h-screen theme-root flex flex-col"
      style={{ background: 'var(--theme-bg)', height: '100dvh' }}
    >
      {/* Header */}
      <div
        className="pf-header px-4 py-3 flex items-center gap-3 shrink-0"
        style={{ borderBottom: '1px solid var(--theme-ghost-border)' }}
      >
        <button className="pf-btn pf-btn-ghost text-sm px-3 py-1" onClick={goBack}>
          ←
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1
              className="text-base font-bold truncate"
              style={{ color: 'var(--theme-accent)', fontFamily: 'var(--theme-font)' }}
            >
              {activeLobby.name}
            </h1>
            {!activeLobby.isActive && (
              <span
                className="text-xs px-1.5 py-0.5 rounded shrink-0"
                style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--theme-hp-low)', border: '1px solid var(--theme-hp-low)' }}
              >
                Chiusa
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            Codice: <span className="font-mono font-bold">{activeLobby.code}</span>
            {' · '}{members.length} membro{members.length !== 1 ? 'i' : ''}
          </p>
        </div>
        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          {isOwner && activeLobby.isActive && (
            <button
              className="pf-btn pf-btn-ghost text-xs px-3 py-1"
              style={{ color: 'var(--theme-hp-low)', borderColor: 'var(--theme-hp-low)' }}
              onClick={() => setConfirmClose(true)}
            >
              Chiudi
            </button>
          )}
          {!isOwner && activeLobby.isActive && (
            <button
              className="pf-btn pf-btn-ghost text-xs px-3 py-1"
              onClick={() => setConfirmLeave(true)}
            >
              Lascia
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--theme-hp-low)' }}>
          {error}
          <button className="ml-2 underline text-xs" onClick={clearError}>Chiudi</button>
        </div>
      )}

      {/* Body: sidebar + chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Members sidebar */}
        <aside
          className="w-48 shrink-0 overflow-y-auto p-3 hidden sm:block"
          style={{ borderRight: '1px solid var(--theme-ghost-border)' }}
        >
          <h2
            className="text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: 'var(--theme-border-strong)' }}
          >
            Partecipanti
          </h2>
          <MembersList members={members} ownerId={activeLobby.ownerId} />
        </aside>

        {/* Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatPanel
            messages={messages}
            currentUserId={uid}
            isActive={activeLobby.isActive}
            onSend={handleSend}
          />
        </div>
      </div>

      {confirmLeave && (
        <ConfirmModal
          title="Lascia lobby"
          message={`Vuoi abbandonare la lobby "${activeLobby.name}"?`}
          confirmLabel="Lascia"
          danger
          onConfirm={handleLeave}
          onCancel={() => setConfirmLeave(false)}
        />
      )}
      {confirmClose && (
        <ConfirmModal
          title="Chiudi lobby"
          message={`Vuoi chiudere la lobby "${activeLobby.name}"? I messaggi restano visibili ma non sarà più possibile scrivere o unirsi.`}
          confirmLabel="Chiudi lobby"
          danger
          onConfirm={handleClose}
          onCancel={() => setConfirmClose(false)}
        />
      )}
    </div>
  );
}
