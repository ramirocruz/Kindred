import { z } from 'zod';

const envelopeSchema = z.object({
  version: z.literal(1),
  iv: z.array(z.number().int().min(0).max(255)).length(12),
  ciphertext: z.array(z.number().int().min(0).max(255)).min(17).max(8016),
}).strict();

export type EncryptedChat = z.infer<typeof envelopeSchema>;

export interface ChatContext {
  roomId: string;
  senderId: string;
  messageId: string;
}

function authenticatedContext(context: ChatContext): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(JSON.stringify([
    'kindred-chat-v1', context.roomId, context.senderId, context.messageId,
  ]));
}

export async function createChatKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

// Transport/key distribution is intentionally separate. Never send this key to the room service.
export async function encryptChat(key: CryptoKey, text: string, context: ChatContext): Promise<EncryptedChat> {
  if (!text.trim() || text.length > 2000) throw new Error('Message must contain 1–2000 characters.');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({
    name: 'AES-GCM', iv, additionalData: authenticatedContext(context), tagLength: 128,
  }, key, new TextEncoder().encode(text));
  return { version: 1, iv: Array.from(iv), ciphertext: Array.from(new Uint8Array(ciphertext)) };
}

export async function decryptChat(key: CryptoKey, payload: unknown, context: ChatContext): Promise<string> {
  const envelope = envelopeSchema.parse(payload);
  const plaintext = await crypto.subtle.decrypt({
    name: 'AES-GCM', iv: new Uint8Array(envelope.iv),
    additionalData: authenticatedContext(context), tagLength: 128,
  }, key, new Uint8Array(envelope.ciphertext));
  const text = new TextDecoder('utf-8', { fatal: true }).decode(plaintext);
  if (!text.trim() || text.length > 2000) throw new Error('Invalid decrypted message.');
  return text;
}
