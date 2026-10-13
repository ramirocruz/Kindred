import { z } from 'zod';
import type { ChatMessage } from '../chat';
import { decryptChat, encryptedChatSchema } from './chat-crypto';

const wireMessageSchema = z.object({
  id: z.string().uuid(),
  author: z.string().min(1).max(24),
  senderId: z.string().uuid(),
  encrypted: encryptedChatSchema,
}).strict();

type WireMessage = z.infer<typeof wireMessageSchema>;

interface InboxOptions {
  key: CryptoKey;
  roomId: string;
  onMessages: (messages: ChatMessage[]) => void;
  onError: () => void;
}

/** Serializes asynchronous decryption so snapshots cannot overtake live messages. */
export class EncryptedChatInbox {
  private queue: Promise<void> = Promise.resolve();
  private messages: ChatMessage[] = [];
  private active = true;
  private historyFingerprint: string | null = null;

  constructor(private readonly options: InboxOptions) {}

  public receive(kind: 'history' | 'message', payload: unknown): Promise<void> {
    this.queue = this.queue.then(async () => {
      if (!this.active) return;
      const incoming = kind === 'history'
        ? z.array(wireMessageSchema).max(100).parse(payload)
        : [wireMessageSchema.parse(payload)];
      const fingerprint = kind === 'history' ? JSON.stringify(incoming) : null;
      if (fingerprint !== null && fingerprint === this.historyFingerprint) return;
      const decrypted = await Promise.all(incoming.map((message) => this.decode(message)));
      if (!this.active) return;
      const byId = new Map((kind === 'history' ? [] : this.messages).map((message) => [message.id, message]));
      decrypted.forEach((message) => byId.set(message.id, message));
      this.messages = [...byId.values()].slice(-100);
      this.historyFingerprint = fingerprint;
      this.options.onMessages(this.messages);
    }).catch(() => { if (this.active) this.options.onError(); });
    return this.queue;
  }

  public dispose(): void {
    this.active = false;
    this.messages = [];
    this.historyFingerprint = null;
  }

  private async decode(message: WireMessage): Promise<ChatMessage> {
    try {
      const text = await decryptChat(this.options.key, message.encrypted, {
        messageId: message.id, roomId: this.options.roomId, senderId: message.senderId,
      });
      return { id: message.id, author: message.author, text };
    } catch {
      if (this.active) this.options.onError();
      // Keep valid history usable if one member sends corrupt or wrong-key ciphertext.
      return { id: message.id, author: message.author, text: 'Message unavailable: could not decrypt.' };
    }
  }
}
