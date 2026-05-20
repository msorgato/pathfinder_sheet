import type { LobbyMember } from '../../types';

interface Props {
  members: LobbyMember[];
  ownerId: string;
  gmUid?: string;
  currentUserId?: string;
  onTransferGM?: (uid: string, name: string) => void;
}

export function MembersList({ members, ownerId, gmUid, currentUserId, onTransferGM }: Props) {
  const effectiveGmUid = gmUid ?? ownerId;
  const isCurrentUserGM = currentUserId === effectiveGmUid;

  if (members.length === 0) {
    return (
      <p className="text-sm text-center py-4" style={{ color: 'var(--theme-text-faint)' }}>
        Nessun membro
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {members.map(m => {
        const isGM = m.userId === effectiveGmUid;
        const canTransfer = isCurrentUserGM && !isGM && !!onTransferGM;
        return (
          <li
            key={m.userId}
            className="flex items-center justify-between px-3 py-2 rounded gap-2"
            style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-ghost-border)' }}
          >
            <span className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>
              {m.displayName}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {isGM && (
                <span
                  className="text-xs px-2 py-0.5 rounded font-semibold"
                  style={{ background: 'rgba(200,164,67,0.2)', color: 'var(--theme-accent)', border: '1px solid var(--theme-accent)' }}
                >
                  GM
                </span>
              )}
              {!isGM && m.userId === ownerId && (
                <span
                  className="text-xs px-2 py-0.5 rounded font-semibold"
                  style={{ background: 'rgba(200,164,67,0.08)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-ghost-border)' }}
                >
                  Owner
                </span>
              )}
              {canTransfer && (
                <button
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ color: 'var(--theme-text-faint)', border: '1px solid var(--theme-ghost-border)', background: 'transparent' }}
                  onClick={() => onTransferGM(m.userId, m.displayName)}
                  title="Trasferisci ruolo GM"
                >
                  ⇒ GM
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
