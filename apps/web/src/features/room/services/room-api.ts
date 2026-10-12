import { z } from 'zod';

const roomSessionSchema = z.object({
  liveKitToken: z.string().min(1),
  liveKitUrl: z.string().url(),
  roomId: z.string().min(1),
});

export type RoomSession = z.infer<typeof roomSessionSchema>;

export async function requestRoomSession(
  roomServiceUrl: string,
  roomId: string,
  displayName: string,
  roomTicket: string,
): Promise<RoomSession> {
  const response = await fetch(`${roomServiceUrl}/v1/rooms/${encodeURIComponent(roomId)}/session`, {
    body: JSON.stringify({ displayName }),
    headers: { authorization: `Bearer ${roomTicket}`, 'content-type': 'application/json' },
    method: 'POST',
  });

  if (!response.ok) {
    if (response.status === 503) throw new Error('Calls are not configured. Set the LiveKit server credentials in the room service.');
    throw new Error('Kindred could not start the room session.');
  }

  return roomSessionSchema.parse(await response.json());
}
