import { useState } from "react";
import type { RoomConnection } from '../useRoomConnection';

export function RoomChat({ connection }: { connection: RoomConnection }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const messages = connection.messages.filter((message) => !hiddenIds.includes(message.id));

  return (
    <section className="chat">
      <button className="chat-heading" aria-expanded={open} onClick={() => setOpen(!open)}>
        Messages <span>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="chat-content">
          <div className="chat-meta"><p className="preview-note">{connection.status} · Clear hides messages only for you.</p>
            {messages.length > 0 && <button onClick={() => setHiddenIds(connection.messages.map((message) => message.id))} aria-label="Clear messages">Clear</button>}
          </div>
          <div className="chat-messages" role="log" aria-label="Messages" aria-live="polite">
            {messages.length === 0 && <p>No messages yet.</p>}
            {messages.map((message) => (
              <p key={message.id}><strong>{message.author}</strong><span>{message.text}</span></p>
            ))}
          </div>
          <form className="chat-compose" onSubmit={async (event) => {
            event.preventDefault();
            if (sending || !draft.trim()) return;
            setSending(true); setError('');
            try { await connection.send(draft.trim()); setDraft(''); }
            catch { setError('Message not confirmed. Check the conversation before retrying.'); }
            finally { setSending(false); }
          }}>
            <input aria-label="Message" placeholder="Say something nice…" maxLength={2000}
              value={draft} disabled={sending} onChange={(event) => setDraft(event.target.value)} />
            <button className="primary-button" type="submit" aria-label="Send message" disabled={!draft.trim() || sending || connection.status !== 'Connected'}>↑</button>
          </form>
          {error && <p role="alert">{error}</p>}
        </div>
      )}
    </section>
  );
}
