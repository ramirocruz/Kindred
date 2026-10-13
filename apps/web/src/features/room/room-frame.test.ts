import { createChatKey } from './services/chat-crypto';
import { openRoomFrame, sealRoomFrame } from './services/room-frame';

describe('encrypted room admission and control frames', () => {
  it('round-trips room data without plaintext metadata in the envelope', async () => {
    const key = await createChatKey();
    const frame = await sealRoomFrame(key, 'room', 'source/channel', 'destination', { kind: 'hello', displayName: 'Private name' });
    expect(JSON.stringify(frame)).not.toContain('Private name');
    expect((await openRoomFrame(key, 'room', 'source/channel', 'destination', frame)).body).toEqual({ kind: 'hello', displayName: 'Private name' });
  });
  it('rejects a wrong key, substituted endpoints, replay across channels and tampering', async () => {
    const key = await createChatKey();
    const frame = await sealRoomFrame(key, 'room', 'source/channel', 'destination', { kind: 'ping' });
    await expect(openRoomFrame(await createChatKey(), 'room', 'source/channel', 'destination', frame)).rejects.toThrow();
    await expect(openRoomFrame(key, 'other-room', 'source/channel', 'destination', frame)).rejects.toThrow();
    await expect(openRoomFrame(key, 'room', 'source/new-channel', 'destination', frame)).rejects.toThrow();
    await expect(openRoomFrame(key, 'room', 'source/channel', 'other-peer', frame)).rejects.toThrow();
    const binary = atob(frame.ciphertext);
    const tampered = btoa(String.fromCharCode(binary.charCodeAt(0) ^ 1) + binary.slice(1));
    await expect(openRoomFrame(key, 'room', 'source/channel', 'destination', { ...frame, ciphertext: tampered })).rejects.toThrow();
  });
});
