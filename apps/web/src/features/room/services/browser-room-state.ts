import { z } from 'zod';
import { encryptedChatSchema } from './chat-crypto';
import { presentationSchema } from './gdrive-protocol';

export const memberSchema = z.object({
  id: z.string().uuid(), displayName: z.string().trim().min(1).max(24), order: z.number().int().positive(),
}).strict();
export const chatWireSchema = z.object({
  id: z.string().uuid(), senderId: z.string().uuid(), author: z.string().min(1).max(24), encrypted: encryptedChatSchema,
}).strict();
export const browserRoomSchema = z.object({
  id: z.string().uuid(), name: z.string().min(1).max(50), reactions: z.boolean(),
  hostId: z.string().uuid(), term: z.number().int().positive(), sequence: z.number().int().nonnegative(),
  nextOrder: z.number().int().positive(), members: z.array(memberSchema).min(1).max(16),
  messages: z.array(chatWireSchema).max(100),
  presentation: presentationSchema.optional(),
}).strict().refine((room) => {
  const ids = room.members.map((member) => member.id);
  const orders = room.members.map((member) => member.order);
  return ids.includes(room.hostId) && (!room.presentation || ids.includes(room.presentation.ownerId)) && new Set(ids).size === ids.length
    && new Set(orders).size === orders.length && orders.every((order) => order < room.nextOrder);
}, 'Invalid membership order');

export type BrowserMember = z.infer<typeof memberSchema>;
export type BrowserRoomState = z.infer<typeof browserRoomSchema>;
export type ChatWireMessage = z.infer<typeof chatWireSchema>;

export function admitMember(room: BrowserRoomState, id: string, displayName: string): BrowserRoomState {
  if (room.members.some((member) => member.id === id)) return room;
  if (room.members.length >= 16) throw new Error('Room is full.');
  const member = memberSchema.parse({ id, displayName, order: room.nextOrder });
  return { ...room, sequence: room.sequence + 1, nextOrder: room.nextOrder + 1, members: [...room.members, member] };
}

export function eldestSuccessor(room: BrowserRoomState, reachable: ReadonlySet<string>): BrowserMember | undefined {
  return room.members.filter((member) => member.id !== room.hostId && reachable.has(member.id))
    .sort((a, b) => a.order - b.order)[0];
}

/** Call only after acquiring the exclusive signaling rendezvous address. */
export function promoteSuccessor(room: BrowserRoomState, id: string, reachable: ReadonlySet<string>): BrowserRoomState {
  if (eldestSuccessor(room, reachable)?.id !== id) throw new Error('Only the eldest reachable member can succeed.');
  const { presentation, ...rest } = room;
  return { ...rest, ...(presentation && reachable.has(presentation.ownerId) && presentation.ownerId !== room.hostId ? { presentation } : {}),
    hostId: id, term: room.term + 1, sequence: room.sequence + 1,
    members: room.members.filter((member) => reachable.has(member.id) && member.id !== room.hostId) };
}

export function isNewerSnapshot(current: BrowserRoomState, incoming: BrowserRoomState): boolean {
  return current.id === incoming.id && (incoming.term > current.term
    || (incoming.term === current.term && incoming.hostId === current.hostId && incoming.sequence >= current.sequence));
}
