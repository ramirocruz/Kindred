import { z } from 'zod';

const CHAT_KEY_BYTES = 32;

export const encryptedChatSchema = z.object({
  version: z.literal(1),
  iv: z.array(z.number().int().min(0).max(255)).length(12),
  ciphertext: z.array(z.number().int().min(0).max(255)).min(17).max(8016),
}).strict();

export type EncryptedChat = z.infer<typeof encryptedChatSchema>;

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

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function decodeBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]{43}$/.test(value)) throw new Error('Invalid chat key encoding.');
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  if (encodeBase64Url(bytes) !== value) throw new Error('Invalid chat key encoding.');
  return bytes;
}

export function createChatSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CHAT_KEY_BYTES));
  return encodeBase64Url(bytes);
}

export async function importChatKey(secret: string): Promise<CryptoKey> {
  const bytes = decodeBase64Url(secret);
  if (bytes.byteLength !== CHAT_KEY_BYTES) throw new Error('Chat key must be 256 bits.');
  const rawKey = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(rawKey).set(bytes);
  return crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function createChatKey(): Promise<CryptoKey> {
  return importChatKey(createChatSecret());
}

export async function encryptChat(key: CryptoKey, text: string, context: ChatContext): Promise<EncryptedChat> {
  if (!text.trim() || text.length > 2000) throw new Error('Message must contain 1–2000 characters.');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({
    name: 'AES-GCM', iv, additionalData: authenticatedContext(context), tagLength: 128,
  }, key, new TextEncoder().encode(text));
  return { version: 1, iv: Array.from(iv), ciphertext: Array.from(new Uint8Array(ciphertext)) };
}

export async function decryptChat(key: CryptoKey, payload: unknown, context: ChatContext): Promise<string> {
  const envelope = encryptedChatSchema.parse(payload);
  const plaintext = await crypto.subtle.decrypt({
    name: 'AES-GCM', iv: new Uint8Array(envelope.iv),
    additionalData: authenticatedContext(context), tagLength: 128,
  }, key, new Uint8Array(envelope.ciphertext));
  const text = new TextDecoder('utf-8', { fatal: true }).decode(plaintext);
  if (!text.trim() || text.length > 2000) throw new Error('Invalid decrypted message.');
  return text;
}
