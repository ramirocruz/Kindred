import { TokenVerifier } from 'livekit-server-sdk';
import { createParticipantToken } from '../src/livekit-token.js';

const config = { LIVEKIT_API_KEY: 'test-key', LIVEKIT_API_SECRET: 'test-secret-longer-than-thirty-two-characters', LIVEKIT_URL: 'ws://localhost:7880', PORT: 3001, ROOM_TICKET_SECRET: 'test-room-secret', WEB_ORIGIN: 'http://localhost:5173' };
describe('LiveKit authorization', () => {
  it('issues a short-lived token bound to the verified room and participant', async () => {
    const token = await createParticipantToken(config, 'private-room', 'member-id');
    const claims = await new TokenVerifier(config.LIVEKIT_API_KEY, config.LIVEKIT_API_SECRET).verify(token);
    expect(claims.sub).toBe('member-id');
    expect(claims.video?.room).toBe('private-room');
    expect(claims.video?.roomJoin).toBe(true);
    expect(Number(claims.exp) - Math.floor(Date.now() / 1000)).toBeLessThanOrEqual(600);
  });
  it('rejects missing media configuration', async () => {
    await expect(createParticipantToken({ PORT: 3001, WEB_ORIGIN: config.WEB_ORIGIN, ROOM_TICKET_SECRET: config.ROOM_TICKET_SECRET }, 'room', 'member')).rejects.toThrow('not configured');
  });
});
