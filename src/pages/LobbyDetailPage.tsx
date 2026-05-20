import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLobbyStore } from '../store/lobbyStore';
import { useCharacterStore } from '../store/characterStore';
import { ChatPanel } from '../components/lobby/ChatPanel';
import { MembersList } from '../components/lobby/MembersList';
import { LobbySheetPanel } from '../components/lobby/LobbySheetPanel';
import { CharacterSelectBar } from '../components/lobby/CharacterSelectBar';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { getUserLobbies } from '../lib/lobbySync';
import type { RollResultData } from '../types';

type MobileTab = 'chat' | 'sheet';

export function LobbyDetailPage() {
  const { id: lobbyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    activeLobby,
    members,
    messages,
    activeCharacterId,
    isHiddenRollEnabled,
    loading,
    error,
    openLobby,
    closeLobbyView,
    leaveLobby,
    closeLobby,
    sendMessage,
    sendRollMessage,
    setActiveCharacter,
    toggleHiddenRoll,
    transferGMRole,
    clearError,
  } = useLobbyStore();
  const uid = user?.uid ?? '';
  const displayName = user?.displayName ?? user?.email ?? 'Utente';
  const isGM = useLobbyStore(s => {
    if (!s.activeLobby) return false;
    return (s.activeLobby.gmUid ?? s.activeLobby.ownerId) === uid;
  });
  const { characters, loadFromFirestore } = useCharacterStore();

  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmTransferGM, setConfirmTransferGM] = useState<{ uid: string; name: string } | null>(null);
  const [loadingLobby, setLoadingLobby] = useState(false);
  const [charLoading, setCharLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');

  // If navigated here directly (refresh), load the lobby from Firestore
  useEffect(() => {
    if (!lobbyId || !uid) return;
    if (activeLobby?.id === lobbyId) return;

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

  // Load characters if not already loaded
  useEffect(() => {
    if (!uid || characters.length > 0) return;
    loadFromFirestore(uid).catch(console.error);
  }, [uid, characters.length, loadFromFirestore]);

  // Load character on-demand if activeCharacterId is set but not in store
  useEffect(() => {
    if (!activeCharacterId || !uid) return;
    const found = characters.find(c => c.id === activeCharacterId);
    if (!found) {
      setCharLoading(true);
      loadFromFirestore(uid)
        .catch(console.error)
        .finally(() => setCharLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCharacterId]);

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

  // Called when a roll is completed in LobbySheetPanel; auto-switches tab on mobile
  const handleRollResult = useCallback(async (rollData: RollResultData) => {
    try {
      await sendRollMessage(uid, displayName, lobbyId!, rollData, isHiddenRollEnabled ? true : undefined);
      if (window.innerWidth < 1024) {
        setTimeout(() => setMobileTab('chat'), 1500);
      }
    } catch {
      // error already in store
    }
  }, [uid, displayName, lobbyId, sendRollMessage, isHiddenRollEnabled]);

  const handleTransferGM = (targetUid: string, targetName: string) => {
    setConfirmTransferGM({ uid: targetUid, name: targetName });
  };

  const handleConfirmTransferGM = async () => {
    if (!confirmTransferGM) return;
    try {
      await transferGMRole(uid, lobbyId!, confirmTransferGM.uid);
    } catch {
      // error already in store
    } finally {
      setConfirmTransferGM(null);
    }
  };

  const handleSelectCharacter = async (charId: string | null) => {
    await setActiveCharacter(uid, charId);
  };

  const activeCharacter = activeCharacterId
    ? (characters.find(c => c.id === activeCharacterId) ?? null)
    : null;

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
        <button className="pf-btn pf-btn-ghost text-sm px-3 py-1" onClick={goBack}>←</button>
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
            <button className="pf-btn pf-btn-ghost text-xs px-3 py-1" onClick={() => setConfirmLeave(true)}>
              Lascia
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 text-sm shrink-0" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--theme-hp-low)' }}>
          {error}
          <button className="ml-2 underline text-xs" onClick={clearError}>Chiudi</button>
        </div>
      )}

      {/* ── Desktop layout (≥1024px): members sidebar + chat 60% + sheet 40% ── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Members sidebar */}
        <aside
          className="w-44 shrink-0 overflow-y-auto p-3"
          style={{ borderRight: '1px solid var(--theme-ghost-border)' }}
        >
          <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-border-strong)' }}>
            Partecipanti
          </h2>
          <MembersList
            members={members}
            ownerId={activeLobby.ownerId}
            gmUid={activeLobby.gmUid}
            currentUserId={uid}
            onTransferGM={handleTransferGM}
          />
        </aside>

        {/* Chat ~60% */}
        <div className="flex-[3] flex flex-col overflow-hidden" style={{ borderRight: '1px solid var(--theme-ghost-border)' }}>
          <ChatPanel
            messages={messages}
            currentUserId={uid}
            isActive={activeLobby.isActive}
            onSend={handleSend}
          />
        </div>

        {/* Sheet panel ~40% */}
        <div className="flex-[2] flex flex-col overflow-hidden min-w-0">
          <div className="px-3 pt-2 pb-1 shrink-0">
            <CharacterSelectBar
              characters={characters}
              activeCharacterId={activeCharacterId}
              onSelect={handleSelectCharacter}
            />
          </div>
          {isGM && (
            <div className="px-3 py-1 shrink-0 flex items-center gap-2 border-b" style={{ borderColor: 'var(--theme-ghost-border)' }}>
              <button
                className="flex items-center gap-2 text-xs font-semibold"
                style={{ color: isHiddenRollEnabled ? 'var(--theme-accent)' : 'var(--theme-text-faint)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={toggleHiddenRoll}
                title={isHiddenRollEnabled ? 'Tiro nascosto attivo — clicca per disattivare' : 'Clicca per attivare il tiro nascosto'}
              >
                <span>{isHiddenRollEnabled ? '👁‍🗨' : '👁'}</span>
                <span>Tiro nascosto</span>
                <span
                  className="ml-1 px-1.5 py-0.5 rounded text-xs"
                  style={{
                    background: isHiddenRollEnabled ? 'rgba(200,164,67,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isHiddenRollEnabled ? 'var(--theme-accent)' : 'var(--theme-ghost-border)'}`,
                  }}
                >
                  {isHiddenRollEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          )}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <LobbySheetPanel
              character={activeCharacter}
              loading={charLoading}
              onRollResult={handleRollResult}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile layout (<1024px): single view + bottom tab bar ── */}
      <div className="flex lg:hidden flex-1 flex-col overflow-hidden">
        {/* Active view */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {mobileTab === 'chat' && (
            <ChatPanel
              messages={messages}
              currentUserId={uid}
              isActive={activeLobby.isActive}
              onSend={handleSend}
            />
          )}
          {mobileTab === 'sheet' && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="px-3 pt-2 pb-1 shrink-0">
                <CharacterSelectBar
                  characters={characters}
                  activeCharacterId={activeCharacterId}
                  onSelect={handleSelectCharacter}
                />
              </div>
              {isGM && (
                <div className="px-3 py-1 shrink-0 flex items-center gap-2 border-b" style={{ borderColor: 'var(--theme-ghost-border)' }}>
                  <button
                    className="flex items-center gap-2 text-xs font-semibold"
                    style={{ color: isHiddenRollEnabled ? 'var(--theme-accent)' : 'var(--theme-text-faint)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={toggleHiddenRoll}
                  >
                    <span>{isHiddenRollEnabled ? '👁‍🗨' : '👁'}</span>
                    <span>Tiro nascosto</span>
                    <span
                      className="ml-1 px-1.5 py-0.5 rounded text-xs"
                      style={{
                        background: isHiddenRollEnabled ? 'rgba(200,164,67,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isHiddenRollEnabled ? 'var(--theme-accent)' : 'var(--theme-ghost-border)'}`,
                      }}
                    >
                      {isHiddenRollEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              )}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <LobbySheetPanel
                  character={activeCharacter}
                  loading={charLoading}
                  onRollResult={handleRollResult}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom tab bar */}
        <div
          className="flex shrink-0 border-t"
          style={{ borderColor: 'var(--theme-ghost-border)', background: 'var(--theme-bg-panel)' }}
        >
          <button
            className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-semibold transition-colors"
            style={{ color: mobileTab === 'chat' ? 'var(--theme-accent)' : 'var(--theme-text-faint)' }}
            onClick={() => setMobileTab('chat')}
          >
            <span className="text-base leading-none">💬</span>
            <span>Chat</span>
          </button>
          <button
            className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-semibold transition-colors"
            style={{ color: mobileTab === 'sheet' ? 'var(--theme-accent)' : 'var(--theme-text-faint)' }}
            onClick={() => setMobileTab('sheet')}
          >
            <span className="text-base leading-none">📜</span>
            <span>Scheda</span>
          </button>
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
      {confirmTransferGM && (
        <ConfirmModal
          title="Trasferisci ruolo GM"
          message={`Vuoi trasferire il ruolo GM a "${confirmTransferGM.name}"? Perderai immediatamente tutti i privilegi GM.`}
          confirmLabel="Trasferisci"
          danger
          onConfirm={handleConfirmTransferGM}
          onCancel={() => setConfirmTransferGM(null)}
        />
      )}
    </div>
  );
}
