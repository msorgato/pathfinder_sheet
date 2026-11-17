import { noticeKind, usePwaStore } from '../../store/pwaStore';

/** The notice itself (presentational, so it can be rendered without the store). */
export function UpdateNotice({ kind, onApply, onDismiss }: {
  kind: 'update' | 'recover';
  onApply: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="update-prompt" role="status" aria-live="polite">
      <div className="update-prompt-text">
        <strong>Nuova versione disponibile</strong>
        {kind === 'recover' && <span>L'aggiornamento automatico non è riuscito: l'app si ripulisce e si ricarica.</span>}
      </div>
      <div className="update-prompt-actions">
        <button type="button" className="pf-btn pf-btn-ghost" onClick={onDismiss}>Dopo</button>
        <button type="button" className="pf-btn pf-btn-gold" onClick={onApply}>Aggiorna</button>
      </div>
    </div>
  );
}

/** Shows the update (or recovery) notice when the PWA has something to offer. */
export function UpdatePrompt() {
  const { needRefresh, stale, dismissed, apply, dismiss } = usePwaStore();
  const kind = noticeKind({ needRefresh, stale, dismissed });
  return kind ? <UpdateNotice kind={kind} onApply={apply} onDismiss={dismiss} /> : null;
}
