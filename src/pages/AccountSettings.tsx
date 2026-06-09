import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { deleteUser, reauthenticateWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuthStore } from '../store/authStore';
import { exportUserData } from '../lib/firestoreSync';
import { auth } from '../lib/firebase';

type DeleteStep = 'idle' | 'confirm' | 'deleting' | 'error';

export function AccountSettings() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [deleteStep, setDeleteStep] = useState<DeleteStep>('idle');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleExport() {
    if (!user) return;
    setExporting(true);
    setExportError(null);
    try {
      const data = await exportUserData(user.uid);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pathfinder-data-${user.uid.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError((err as Error).message ?? 'Errore durante l\'esportazione');
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (!user) return;
    setDeleteStep('deleting');
    setDeleteError(null);
    try {
      // Try Cloud Function first (requires Blaze plan + deploy)
      const fn = httpsCallable(getFunctions(), 'deleteUserAccount');
      await fn();
      await signOut();
    } catch (cfErr: unknown) {
      // CF not deployed yet — fall back to client-side delete
      const code = (cfErr as { code?: string }).code;
      if (code === 'functions/not-found' || code === 'functions/unavailable' || code === 'functions/internal') {
        try {
          const currentUser = auth.currentUser;
          if (!currentUser) throw new Error('Nessun utente attivo');
          // Re-authenticate to ensure credentials are fresh
          await reauthenticateWithPopup(currentUser, new GoogleAuthProvider());
          await deleteUser(currentUser);
          // Auth deletion triggers onAuthStateChanged → route guard redirects to /login
        } catch (authErr: unknown) {
          const authCode = (authErr as { code?: string }).code;
          if (authCode === 'auth/requires-recent-login') {
            setDeleteError('Effettua di nuovo il login e riprova.');
          } else {
            setDeleteError((authErr as Error).message ?? 'Errore durante l\'eliminazione');
          }
          setDeleteStep('error');
        }
      } else {
        setDeleteError((cfErr as Error).message ?? 'Errore durante l\'eliminazione');
        setDeleteStep('error');
      }
    }
  }

  return (
    <div
      className="min-h-screen theme-root flex flex-col"
      style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid var(--theme-border)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="pf-btn pf-btn-ghost text-sm px-3 py-1"
        >
          ← Indietro
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--theme-accent)' }}>
          Impostazioni Account
        </h1>
      </div>

      <div className="flex flex-col gap-6 p-6 max-w-xl w-full mx-auto">

        {/* Export section */}
        <div className="pf-panel p-5">
          <h2 className="font-bold text-base mb-1" style={{ color: 'var(--theme-text)' }}>
            Esporta i miei dati
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>
            Scarica un file JSON con tutti i tuoi dati: personaggi, impostazioni e partecipazioni alle lobby.
          </p>
          <button
            className="pf-btn pf-btn-ghost text-sm px-4 py-2"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Esportazione…' : 'Scarica i miei dati'}
          </button>
          {exportError && (
            <p className="text-xs mt-2" style={{ color: 'var(--theme-danger, #e57373)' }}>
              {exportError}
            </p>
          )}
        </div>

        {/* Delete account section */}
        <div
          className="pf-panel p-5"
          style={{ borderColor: 'var(--theme-danger, #e57373)' }}
        >
          <h2 className="font-bold text-base mb-1" style={{ color: 'var(--theme-danger, #e57373)' }}>
            Elimina account
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>
            Rimuove in modo permanente il tuo account, i tuoi personaggi e tutti i dati associati.
            L'operazione è irreversibile.
          </p>

          {deleteStep === 'idle' && (
            <button
              className="pf-btn pf-btn-ghost text-sm px-4 py-2"
              style={{ borderColor: 'var(--theme-danger, #e57373)', color: 'var(--theme-danger, #e57373)' }}
              onClick={() => setDeleteStep('confirm')}
            >
              Elimina account
            </button>
          )}

          {deleteStep === 'confirm' && (
            <div
              className="pf-panel p-4"
              style={{ background: 'var(--theme-bg-panel)' }}
            >
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--theme-text)' }}>
                Sei sicuro? Questa azione non può essere annullata.
              </p>
              <div className="flex gap-2">
                <button
                  className="pf-btn pf-btn-ghost text-sm px-4 py-2"
                  style={{ borderColor: 'var(--theme-danger, #e57373)', color: 'var(--theme-danger, #e57373)' }}
                  onClick={handleDelete}
                >
                  Sì, elimina il mio account
                </button>
                <button
                  className="pf-btn pf-btn-ghost text-sm px-4 py-2"
                  onClick={() => setDeleteStep('idle')}
                >
                  Annulla
                </button>
              </div>
            </div>
          )}

          {deleteStep === 'deleting' && (
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              Eliminazione in corso…
            </p>
          )}

          {deleteStep === 'error' && (
            <div>
              <p className="text-sm mb-2" style={{ color: 'var(--theme-danger, #e57373)' }}>
                {deleteError}
              </p>
              <button
                className="pf-btn pf-btn-ghost text-sm px-3 py-1"
                onClick={() => setDeleteStep('idle')}
              >
                Riprova
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
