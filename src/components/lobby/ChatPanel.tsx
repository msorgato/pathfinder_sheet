import { useState, useRef, useEffect } from 'react';
import type { LobbyMessage } from '../../types';
import { RollMessage } from './RollMessage';

interface Props {
  messages: LobbyMessage[];
  currentUserId: string;
  isActive: boolean;
  onSend: (content: string) => Promise<void>;
}

function formatTime(ms: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export function ChatPanel({ messages, currentUserId, isActive, onSend }: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    setError('');
    try {
      await onSend(trimmed);
      setText('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
        style={{ minHeight: 0 }}
      >
        {messages.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: 'var(--theme-text-faint)' }}>
            Nessun messaggio. Sii il primo a scrivere!
          </p>
        )}
        {messages.map(msg => {
          const isMine = msg.senderId === currentUserId;
          if (msg.type === 'roll' && msg.rollData) {
            return <RollMessage key={msg.id} msg={msg} isMine={isMine} />;
          }
          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <div
                className="max-w-[75%] px-3 py-2 rounded-lg text-sm"
                style={{
                  background: isMine ? 'rgba(200,164,67,0.15)' : 'var(--theme-bg)',
                  border: `1px solid ${isMine ? 'var(--theme-accent)' : 'var(--theme-ghost-border)'}`,
                  color: 'var(--theme-text)',
                  wordBreak: 'break-word',
                }}
              >
                {!isMine && (
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--theme-accent)' }}>
                    {msg.senderName}
                  </p>
                )}
                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              </div>
              <span className="text-xs mt-0.5 px-1" style={{ color: 'var(--theme-text-faint)' }}>
                {formatTime(msg.sentAt)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isActive ? (
        <form
          onSubmit={submit}
          className="border-t p-3 flex gap-2"
          style={{ borderColor: 'var(--theme-ghost-border)' }}
        >
          <textarea
            className="flex-1 pf-input resize-none text-sm"
            rows={2}
            value={text}
            onChange={e => { setText(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi un messaggio… (Invio per inviare)"
            disabled={sending}
            maxLength={2000}
          />
          <button
            type="submit"
            className="pf-btn pf-btn-gold px-4 self-end text-sm font-semibold"
            disabled={sending || !text.trim()}
          >
            {sending ? '…' : 'Invia'}
          </button>
        </form>
      ) : (
        <div
          className="border-t p-3 text-center text-sm"
          style={{ borderColor: 'var(--theme-ghost-border)', color: 'var(--theme-text-faint)' }}
        >
          Questa lobby è chiusa. Non è possibile inviare nuovi messaggi.
        </div>
      )}
      {error && (
        <p className="text-xs px-3 pb-2" style={{ color: 'var(--theme-hp-low)' }}>{error}</p>
      )}
    </div>
  );
}
