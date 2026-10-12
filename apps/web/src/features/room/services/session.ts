import { z } from 'zod';
import type { LocalRoom } from '../local-room';

const sessionSchema = z.object({ id: z.string(), name: z.string(), reactions: z.boolean(), identity: z.string(), ticket: z.string(), invite: z.string() });
export type RoomSession = z.infer<typeof sessionSchema> & { displayName: string };

export async function openRoom(room: LocalRoom, invite?: string): Promise<RoomSession> {
  const response = await fetch(invite ? '/v1/rooms/join' : '/v1/rooms', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invite ? { invite, displayName: room.displayName } : room),
  });
  if (!response.ok) throw new Error('Room unavailable. Check the room service and invite link.');
  return { ...sessionSchema.parse(await response.json()), displayName: room.displayName };
}
