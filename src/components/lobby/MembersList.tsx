import type { LobbyMember } from '../../types';

interface Props {
  members: LobbyMember[];
  ownerId: string;
}

export function MembersList({ members, ownerId }: Props) {
  if (members.length === 0) {
    return (
      <p className="text-sm text-center py-4" style={{ color: 'var(--theme-text-faint)' }}>
        Nessun membro
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {members.map(m => (
        <li
          key={m.userId}
          className="flex items-center justify-between px-3 py-2 rounded"
          style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-ghost-border)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
            {m.displayName}
          </span>
          {m.userId === ownerId && (
            <span
              className="text-xs px-2 py-0.5 rounded font-semibold"
              style={{ background: 'rgba(200,164,67,0.15)', color: 'var(--theme-accent)', border: '1px solid var(--theme-accent)' }}
            >
              Owner
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
