import { AccessToken } from 'livekit-server-sdk';

import type { RoomServiceConfig } from './config.js';

export async function createParticipantToken(
  config: RoomServiceConfig,
  roomId: string,
  identity: string,
): Promise<string> {
  const token = new AccessToken(config.LIVEKIT_API_KEY, config.LIVEKIT_API_SECRET, { identity });
  token.addGrant({
    canPublish: true,
    canSubscribe: true,
    room: roomId,
    roomJoin: true,
  });
  return token.toJwt();
}
