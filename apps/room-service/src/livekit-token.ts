import { AccessToken } from 'livekit-server-sdk';

import type { RoomServiceConfig } from './config.js';

export async function createParticipantToken(
  config: RoomServiceConfig,
  roomId: string,
  identity: string,
): Promise<string> {
  if (!config.LIVEKIT_API_KEY || !config.LIVEKIT_API_SECRET || !config.LIVEKIT_URL) {
    throw new Error('LiveKit is not configured.');
  }
  const token = new AccessToken(config.LIVEKIT_API_KEY, config.LIVEKIT_API_SECRET, { identity, ttl: '10m' });
  token.addGrant({
    canPublish: true,
    canSubscribe: true,
    room: roomId,
    roomJoin: true,
  });
  return token.toJwt();
}
