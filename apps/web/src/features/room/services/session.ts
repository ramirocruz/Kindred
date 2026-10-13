import { z } from 'zod';
import { createLocalRoom, type LocalRoom } from '../local-room';
import { createChatSecret, importChatKey } from './chat-crypto';

export interface RoomSession {
  id: string;
  name: string;
  reactions: boolean;
  identity: string;
  invite: string;
  creator: boolean;
  chatInviteSecret: string;
  chatKey: CryptoKey;
  displayName: string;
}
export interface ParsedInviteLink { chatInviteSecret: string; invite: string }

export function buildInviteFragment(invite: string, chatInviteSecret: string): string {
  return `#${new URLSearchParams({ invite, chatKey: chatInviteSecret }).toString()}`;
}

export function parseInviteLink(input: string, baseUrl = 'http://kindred.local/'): ParsedInviteLink | null {
  try {
    const url = new URL(input, baseUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const params = new URLSearchParams(url.hash.slice(1));
    if (params.getAll('invite').length !== 1 || params.getAll('chatKey').length !== 1) return null;
    const invite = params.get('invite') ?? '';
    const chatInviteSecret = params.get('chatKey') ?? '';
    if (!z.string().uuid().safeParse(invite).success || !/^[A-Za-z0-9_-]{43}$/.test(chatInviteSecret)) return null;
    return { invite, chatInviteSecret };
  } catch { return null; }
}

/** The host admits guests over encrypted WebRTC; no HTTP room API is called. */
export async function openRoom(input: LocalRoom, invitation?: ParsedInviteLink): Promise<RoomSession> {
  const displayName = input.displayName.trim().slice(0, 24);
  if (!displayName) throw new Error('Enter your display name.');
  const room = invitation ? { ...input, displayName, name: 'Joining…' } : createLocalRoom(displayName, input.name, input.reactions);
  const id = invitation ? z.string().uuid().parse(invitation.invite) : crypto.randomUUID();
  const chatInviteSecret = invitation?.chatInviteSecret ?? createChatSecret();
  const chatKey = await importChatKey(chatInviteSecret);
  return { ...room, id, identity: crypto.randomUUID(), invite: id, creator: !invitation, chatInviteSecret, chatKey };
}
