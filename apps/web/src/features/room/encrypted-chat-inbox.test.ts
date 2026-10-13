import { jest } from '@jest/globals';
import { EncryptedChatInbox } from './services/encrypted-chat-inbox';
import { createChatKey, encryptChat } from './services/chat-crypto';

const roomId = crypto.randomUUID();
const senderId = crypto.randomUUID();

async function wireMessage(key: CryptoKey, text: string): Promise<unknown> {
  const id = crypto.randomUUID();
  return { id, senderId, author: 'Member', encrypted: await encryptChat(key, text, { roomId, senderId, messageId: id }) };
}

describe('encrypted chat inbox', () => {
  it('does not decrypt and republish identical history snapshots', async () => {
    const key = await createChatKey(), onMessages = jest.fn();
    const inbox = new EncryptedChatInbox({ key, roomId, onMessages, onError: jest.fn() });
    const history = [await wireMessage(key, 'Retained')];
    await inbox.receive('history', history);
    await inbox.receive('history', JSON.parse(JSON.stringify(history)) as unknown);
    expect(onMessages).toHaveBeenCalledTimes(1);
    await inbox.receive('history', [...history, await wireMessage(key, 'Changed')]);
    expect(onMessages).toHaveBeenCalledTimes(2);
    inbox.dispose();
  });
  it('keeps history and live messages ordered and deduplicates redelivery', async () => {
    const key = await createChatKey();
    const onMessages = jest.fn();
    const inbox = new EncryptedChatInbox({ key, roomId, onMessages, onError: jest.fn() });
    const history = await wireMessage(key, 'Before join');
    const live = await wireMessage(key, 'After join');
    const pendingHistory = inbox.receive('history', [history]);
    const pendingLive = inbox.receive('message', live);
    await Promise.all([pendingHistory, pendingLive]);
    await inbox.receive('message', live);
    expect(onMessages.mock.lastCall?.[0]).toEqual([
      expect.objectContaining({ text: 'Before join' }), expect.objectContaining({ text: 'After join' }),
    ]);
  });

  it('isolates undecryptable messages and continues receiving valid chat', async () => {
    const key = await createChatKey();
    const onMessages = jest.fn();
    const onError = jest.fn();
    const inbox = new EncryptedChatInbox({ key, roomId, onMessages, onError });
    await inbox.receive('history', [await wireMessage(await createChatKey(), 'Wrong key'), await wireMessage(key, 'Valid')]);
    await inbox.receive('message', await wireMessage(key, 'Still works'));
    expect(onMessages.mock.lastCall?.[0]).toEqual([
      expect.objectContaining({ text: 'Message unavailable: could not decrypt.' }),
      expect.objectContaining({ text: 'Valid' }), expect.objectContaining({ text: 'Still works' }),
    ]);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('rejects plaintext and oversized history without erasing valid messages', async () => {
    const key = await createChatKey();
    const onMessages = jest.fn();
    const onError = jest.fn();
    const inbox = new EncryptedChatInbox({ key, roomId, onMessages, onError });
    const message = await wireMessage(key, 'Keep this');
    await inbox.receive('message', message);
    await inbox.receive('message', { id: crypto.randomUUID(), text: 'Plaintext' });
    await inbox.receive('history', Array(101).fill(message));
    expect(onMessages).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it('does not update a room after disposal while decryption is pending', async () => {
    const key = await createChatKey();
    const onMessages = jest.fn();
    const onError = jest.fn();
    const inbox = new EncryptedChatInbox({ key, roomId, onMessages, onError });
    const pending = inbox.receive('message', await wireMessage(key, 'Leaving'));
    inbox.dispose();
    await pending;
    await inbox.receive('message', { text: 'Late invalid event' });
    expect(onMessages).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
