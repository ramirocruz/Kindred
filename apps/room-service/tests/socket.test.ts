import { createServer } from 'node:http';
import { io, type Socket } from 'socket.io-client';
import { attachRoomSocket } from '../src/transport/socket-server.js';
import { RoomRegistry } from '../src/rooms/room-registry.js';
import { Invitations } from '../src/rooms/invitations.js';

describe('real room transport', () => {
  it('authorizes joins, delivers scoped messages and removes disconnected members', async () => {
    const http = createServer();
    const registry = new RoomRegistry();
    const secret = 'test-secret-longer-than-32-characters';
    const server = attachRoomSocket(http, 'http://localhost', registry, { info: () => {} }, secret);
    await new Promise<void>((resolve) => http.listen(0, '127.0.0.1', resolve));
    const address = http.address();
    if (!address || typeof address === 'string') throw new Error('Missing test address');
    const clients: Socket[] = [];
    async function connect(): Promise<Socket> {
      const client = io(`http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`, { transports: ['websocket'], forceNew: true });
      clients.push(client);
      await new Promise<void>((resolve) => client.once('connect', resolve));
      return client;
    }
    try {
      const invites = new Invitations(secret);
      const invite = invites.create('Room', true, Date.now());
      const first = invites.join(invite, 'Host', Date.now())!;
      const second = invites.join(invite, 'Guest', Date.now())!;
      const a = await connect(); const b = await connect(); const outsider = await connect();
      expect(await outsider.timeout(2000).emitWithAck('room:join', { roomId: first.id, ticket: 'invalid' })).toHaveProperty('error');
      expect(await outsider.timeout(2000).emitWithAck('chat:send', { text: 'No access' })).toHaveProperty('error');
      await a.timeout(2000).emitWithAck('room:join', { roomId: first.id, ticket: first.ticket });
      await b.timeout(2000).emitWithAck('room:join', { roomId: second.id, ticket: second.ticket });
      expect(registry.get(first.id)?.members.size).toBe(2);
      const delivered = new Promise<unknown>((resolve) => b.once('chat:message', resolve));
      await a.timeout(2000).emitWithAck('chat:send', { text: 'Hello', author: 'Forged' });
      expect(await delivered).toMatchObject({ text: 'Hello', author: 'Host' });
      expect(await b.timeout(2000).emitWithAck('chat:send', { text: ' '.repeat(4) })).toHaveProperty('error');
      const state = new Promise<{ members: unknown[] }>((resolve) => a.once('room:state', resolve));
      b.disconnect();
      expect((await state).members).toHaveLength(1);
    } finally {
      clients.forEach((client) => client.disconnect());
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
