import { createChatKey, decryptChat, encryptChat } from './services/chat-crypto';

const context = { roomId: 'room-a', senderId: 'sender-a', messageId: 'message-a' };

describe('chat encryption foundation (not yet connected to transport)', () => {
  it('round-trips Unicode with a non-exportable AES-256 key', async () => {
    const key = await createChatKey();
    expect(key.extractable).toBe(false);
    const encrypted = await encryptChat(key, 'Hello 👋 नमस्ते', context);
    expect(encrypted).not.toHaveProperty('text');
    await expect(decryptChat(key, encrypted, context)).resolves.toBe('Hello 👋 नमस्ते');
  });

  it('uses a fresh nonce for repeated messages', async () => {
    const key = await createChatKey();
    const first = await encryptChat(key, 'Hello', context);
    const second = await encryptChat(key, 'Hello', context);
    expect(first.iv).not.toEqual(second.iv);
    expect(first.ciphertext).not.toEqual(second.ciphertext);
  });

  it('rejects a wrong key and altered ciphertext', async () => {
    const key = await createChatKey();
    const encrypted = await encryptChat(key, 'Hello', context);
    await expect(decryptChat(await createChatKey(), encrypted, context)).rejects.toThrow();
    encrypted.ciphertext[0] ^= 1;
    await expect(decryptChat(key, encrypted, context)).rejects.toThrow();
  });

  it.each(['roomId', 'senderId', 'messageId'] as const)('authenticates %s', async (field) => {
    const key = await createChatKey();
    const encrypted = await encryptChat(key, 'Hello', context);
    await expect(decryptChat(key, encrypted, { ...context, [field]: 'changed' })).rejects.toThrow();
  });

  it('rejects plaintext, unsupported versions and malformed nonces', async () => {
    const key = await createChatKey();
    const encrypted = await encryptChat(key, 'Hello', context);
    for (const payload of [{ text: 'Hello' }, { ...encrypted, version: 2 }, { ...encrypted, iv: [0] }]) {
      await expect(decryptChat(key, payload, context)).rejects.toThrow();
    }
  });

  it('bounds message length and rejects blank messages', async () => {
    const key = await createChatKey();
    await expect(encryptChat(key, ' ', context)).rejects.toThrow();
    await expect(encryptChat(key, 'a'.repeat(2001), context)).rejects.toThrow();
    const text = '😀'.repeat(1000);
    await expect(decryptChat(key, await encryptChat(key, text, context), context)).resolves.toBe(text);
  });
});
