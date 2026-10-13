import { z } from 'zod';

const MAX_BYTES = 4 * 1024 * 1024;
const frameSchema = z.object({
  version: z.literal(1), id: z.string().uuid(), iv: z.string().max(24), ciphertext: z.string().max(Math.ceil(MAX_BYTES * 4 / 3) + 32),
}).strict();

function encode(bytes: Uint8Array): string {
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 8192) chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 8192)));
  return btoa(chunks.join(''));
}

function decode(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function context(roomId: string, source: string, destination: string, id: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(JSON.stringify(['kindred-room-frame-v1', roomId, source, destination, id]));
}

export async function sealRoomFrame(key: CryptoKey, roomId: string, source: string, destination: string, payload: unknown): Promise<z.infer<typeof frameSchema>> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  if (bytes.length > MAX_BYTES) throw new Error('Room update is too large.');
  const id = crypto.randomUUID();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: context(roomId, source, destination, id), tagLength: 128 }, key, bytes);
  return { version: 1, id, iv: encode(iv), ciphertext: encode(new Uint8Array(ciphertext)) };
}

export async function openRoomFrame(key: CryptoKey, roomId: string, source: string, destination: string, payload: unknown): Promise<{ id: string; body: unknown }> {
  const frame = frameSchema.parse(payload);
  const iv = decode(frame.iv);
  const bytes = decode(frame.ciphertext);
  if (iv.length !== 12 || bytes.length < 17 || bytes.length > MAX_BYTES + 16) throw new Error('Invalid room frame.');
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: context(roomId, source, destination, frame.id), tagLength: 128 }, key, bytes);
  return { id: frame.id, body: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plaintext)) };
}
