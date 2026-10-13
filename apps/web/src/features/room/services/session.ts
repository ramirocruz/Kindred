import { z } from 'zod';
import type { LocalRoom } from '../local-room';
import { createChatSecret, importChatKey } from './chat-crypto';

const sessionSchema = z.object({ id: z.string(), name: z.string(), reactions: z.boolean(), identity: z.string(), ticket: z.string(), invite: z.string() });
export type ServerRoomSession = z.infer<typeof sessionSchema>;
export type RoomSession = ServerRoomSession & { chatInviteSecret: string; chatKey: CryptoKey; displayName: string };
export interface ParsedInviteLink { chatInviteSecret: string; invite: string }

const chatSecretSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export function buildInviteFragment(invite: string, chatInviteSecret: string): string {
  const params = new URLSearchParams({ invite, chatKey: chatInviteSecret });
  return `#${params.toString()}`;
}

export function parseInviteLink(input: string, baseUrl = 'http://kindred.local/'): ParsedInviteLink | null {
  try {
    const url = new URL(input, baseUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const hash = url.hash;
    const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    if (params.getAll('invite').length !== 1 || params.getAll('chatKey').length !== 1) return null;
    const invite = params.get('invite')?.trim() ?? '';
    const chatInviteSecret = params.get('chatKey')?.trim() ?? '';
    if (!invite || invite.length > 100 || !chatSecretSchema.safeParse(chatInviteSecret).success) return null;
    return { invite, chatInviteSecret };
  } catch {
    return null;
  }
}

export async function openRoom(room: LocalRoom, invitation?: ParsedInviteLink): Promise<RoomSession> {
  const chatInviteSecret = invitation?.chatInviteSecret ?? createChatSecret();
  const chatKey = await importChatKey(chatInviteSecret);
  const response = await fetch(invitation ? '/v1/rooms/join' : '/v1/rooms', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invitation ? { invite: invitation.invite, displayName: room.displayName } : room),
  });
  if (!response.ok) throw new Error('Room unavailable. Check the room service and invite link.');
  return { ...sessionSchema.parse(await response.json()), chatInviteSecret, chatKey, displayName: room.displayName };
}
