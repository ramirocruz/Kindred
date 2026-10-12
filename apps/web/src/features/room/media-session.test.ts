import { jest } from '@jest/globals';
import { requestRoomSession } from './services/room-api';

describe('media session request', () => {
  afterEach(() => jest.restoreAllMocks());
  it('sends the signed ticket and validates the media response', async () => {
    const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ liveKitToken: 'token', liveKitUrl: 'wss://media.example.com', roomId: 'room' })));
    await expect(requestRoomSession('', 'room', 'Member', 'signed-ticket')).resolves.toHaveProperty('liveKitToken', 'token');
    expect(fetch).toHaveBeenCalledWith('/v1/rooms/room/session', expect.objectContaining({ headers: expect.objectContaining({ authorization: 'Bearer signed-ticket' }) }));
  });
  it('explains missing server configuration instead of pretending calls connected', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 503 }));
    await expect(requestRoomSession('', 'room', 'Member', 'ticket')).rejects.toThrow('Calls are not configured');
  });
});
