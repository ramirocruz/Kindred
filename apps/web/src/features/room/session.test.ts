import { jest } from '@jest/globals';
import { buildInviteFragment, openRoom, parseInviteLink } from './services/session';
import { createChatSecret } from './services/chat-crypto';

describe('browser-owned room sessions', () => {
  afterEach(() => jest.restoreAllMocks());
  it('creates a room and encryption key without any HTTP API', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const session = await openRoom({ displayName: 'Host', name: 'Film night', reactions: true });
    expect(session.creator).toBe(true);
    expect(session.chatKey.extractable).toBe(false);
    expect(parseInviteLink(buildInviteFragment(session.invite, session.chatInviteSecret)))
      .toEqual({ invite: session.id, chatInviteSecret: session.chatInviteSecret });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('rejoins with a new identity and no creator privilege', async () => {
    const host = await openRoom({ displayName: 'Host', name: 'Room', reactions: true });
    const invite = { invite: host.invite, chatInviteSecret: host.chatInviteSecret };
    const guest = await openRoom({ displayName: 'Returning host', name: '', reactions: true }, invite);
    expect(guest.creator).toBe(false);
    expect(guest.identity).not.toBe(host.identity);
    expect(guest.id).toBe(host.id);
  });
  it('rejects missing keys, ambiguous parameters, non-web links and old service IDs', () => {
    const id = crypto.randomUUID();
    const secret = createChatSecret();
    for (const input of [`#invite=${id}`, `#invite=${id}&chatKey=short`, `#invite=${id}&invite=${id}&chatKey=${secret}`,
      `#invite=${id}&chatKey=${secret}&chatKey=${secret}`, `javascript:alert(1)#invite=${id}&chatKey=${secret}`, `#invite=old-server-token&chatKey=${secret}`]) {
      expect(parseInviteLink(input)).toBeNull();
    }
  });
  it('rejects blank names and malformed keys before creating a session', async () => {
    await expect(openRoom({ displayName: ' ', name: 'Room', reactions: true })).rejects.toThrow();
    await expect(openRoom({ displayName: 'Guest', name: '', reactions: true }, { invite: crypto.randomUUID(), chatInviteSecret: 'invalid' })).rejects.toThrow();
  });
});
