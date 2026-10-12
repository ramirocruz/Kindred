import { useState } from "react";
import { createChatMessage } from "../chat";
import type { ChatMessage } from "../chat";

export function RoomChat({ displayName }: { displayName: string }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  return (
    <section className="chat">
      <button className="chat-heading" aria-expanded={open} onClick={() => setOpen(!open)}>
        Messages <span>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="chat-content">
          <div className="chat-meta"><p className="preview-note">Local preview only — messages are not sent to other members.</p>
            {messages.length > 0 && <button onClick={() => setMessages([])} aria-label="Clear messages">Clear</button>}
          </div>
          <div className="chat-messages" role="log" aria-label="Messages" aria-live="polite">
            {messages.length === 0 && <p>No messages yet.</p>}
            {messages.map((message) => (
              <p key={message.id}><strong>{message.author}</strong><span>{message.text}</span></p>
            ))}
          </div>
          <form className="chat-compose" onSubmit={(event) => {
            event.preventDefault();
            const message = createChatMessage(crypto.randomUUID(), displayName, draft);
            if (!message) return;
            setMessages((previous) => [...previous, message]);
            setDraft("");
          }}>
            <input aria-label="Message" placeholder="Say something nice…" maxLength={2000}
              value={draft} onChange={(event) => setDraft(event.target.value)} />
            <button className="primary-button" type="submit" aria-label="Send message" disabled={!draft.trim()}>↑</button>
          </form>
        </div>
      )}
    </section>
  );
}
