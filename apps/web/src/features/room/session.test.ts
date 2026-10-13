import { jest } from '@jest/globals';
import { buildInviteFragment, openRoom, parseInviteLink } from './services/session';
import { createChatSecret } from './services/chat-crypto';

describe('encrypted invitation links', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps the chat secret in the URL fragment and out of room-service requests', async () => {
    const chatInviteSecret = createChatSecret();
    const invitation = parseInviteLink(`https://kindred.example/room${buildInviteFragment('server-invite', chatInviteSecret)}`);
    expect(invitation).toEqual({ chatInviteSecret, invite: 'server-invite' });

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      id: 'room-1', identity: 'guest-1', invite: 'server-invite', name: 'Film night', reactions: true, ticket: 'ticket',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const session = await openRoom({ displayName: 'Guest', name: '', reactions: true }, invitation ?? undefined);
    expect(session.chatInviteSecret).toBe(chatInviteSecret);
    expect(session.chatKey.extractable).toBe(false);
    expect(fetchSpy).toHaveBeenCalledWith('/v1/rooms/join', expect.objectContaining({
      body: JSON.stringify({ invite: 'server-invite', displayName: 'Guest' }),
    }));
    expect(fetchSpy.mock.calls[0]?.[1]).not.toEqual(expect.objectContaining({ body: expect.stringContaining(chatInviteSecret) }));
  });

  it('rejects old plaintext-only invite fragments', () => {
    expect(parseInviteLink('https://kindred.example/#invite=server-invite')).toBeNull();
    expect(parseInviteLink('https://kindred.example/#invite=server-invite&chatKey=short')).toBeNull();
  });

  it('rejects ambiguous invitations and non-web links', () => {
    const secret = createChatSecret();
    expect(parseInviteLink(`#invite=a&invite=b&chatKey=${secret}`)).toBeNull();
    expect(parseInviteLink(`#invite=a&chatKey=${secret}&chatKey=${secret}`)).toBeNull();
    expect(parseInviteLink(`javascript:alert(1)#invite=a&chatKey=${secret}`)).toBeNull();
  });

  it('creates a client-only key before requesting a new room', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      id: 'room-1', identity: 'host-1', invite: 'invite', name: 'Film night', reactions: true, ticket: 'ticket',
    })));
    const input = { displayName: 'Host', name: 'Film night', reactions: true };
    const session = await openRoom(input);
    expect(fetchSpy).toHaveBeenCalledWith('/v1/rooms', expect.objectContaining({ body: JSON.stringify(input) }));
    expect(fetchSpy.mock.calls[0]?.[1]?.body).not.toContain(session.chatInviteSecret);
    expect(session.chatKey.extractable).toBe(false);
  });

  it('does not contact the service with an invalid chat secret', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    await expect(openRoom({ displayName: 'Guest', name: '', reactions: true }, { invite: 'invite', chatInviteSecret: 'invalid' })).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
