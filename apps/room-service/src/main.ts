import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';

import { loadRoomServiceConfig } from './config.js';
import { verifyRoomTicket } from './auth/room-ticket.js';
import { createParticipantToken } from './livekit-token.js';
import { RoomRegistry } from './rooms/room-registry.js';
import { attachRoomSocket } from './transport/socket-server.js';
import { Invitations } from './rooms/invitations.js';

const sessionBodySchema = z.object({
  displayName: z.string().trim().min(1).max(24),
});

export async function startRoomService(): Promise<void> {
  const config = loadRoomServiceConfig(process.env);
  const app = Fastify({ logger: true });
  const registry = new RoomRegistry();
  const invitations = new Invitations(config.ROOM_TICKET_SECRET);

  await app.register(cors, { origin: config.WEB_ORIGIN });
  attachRoomSocket(app.server, config.WEB_ORIGIN, registry, app.log, config.ROOM_TICKET_SECRET);

  app.post('/v1/rooms', async (request, reply) => {
    const parsed = z.object({ name: z.string().trim().min(1).max(50), displayName: z.string().trim().min(1).max(24), reactions: z.boolean() }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Enter a room name and display name.' });
    try {
      const invite = invitations.create(parsed.data.name, parsed.data.reactions, Date.now());
      return { ...invitations.join(invite, parsed.data.displayName, Date.now()), invite };
    } catch { return reply.code(503).send({ error: 'Room capacity reached. Try later.' }); }
  });
  app.post('/v1/rooms/join', async (request, reply) => {
    const parsed = z.object({ invite: z.string().min(1).max(100), displayName: z.string().trim().min(1).max(24) }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Enter a valid invitation and name.' });
    const session = invitations.join(parsed.data.invite, parsed.data.displayName, Date.now());
    if (!session) return reply.code(403).send({ error: 'Invitation is invalid or expired. Ask for a new room link.' });
    return { ...session, invite: parsed.data.invite };
  });

  app.post<{ Params: { roomId?: string }; Body: unknown }>('/v1/rooms/:roomId/session', async (request, reply) => {
    const roomId = z.string().trim().min(1).max(80).safeParse(request.params.roomId);
    const body = sessionBodySchema.safeParse(request.body);
    if (!roomId.success || !body.success) {
      return reply.code(400).send({ error: 'Invalid room session request.' });
    }

    const authorization = request.headers.authorization;
    const ticket = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    const claims = verifyRoomTicket(ticket, config.ROOM_TICKET_SECRET, Date.now());
    if (!claims || claims.roomId !== roomId.data || claims.displayName !== body.data.displayName) {
      return reply.code(403).send({ error: 'Room invitation is invalid or expired.' });
    }

    if (!config.LIVEKIT_API_KEY || !config.LIVEKIT_API_SECRET || !config.LIVEKIT_URL) {
      return reply.code(503).send({ error: 'Media is not configured yet.' });
    }
    const liveKitToken = await createParticipantToken(config, roomId.data, claims.identity);
    return { identity: claims.identity, liveKitToken, liveKitUrl: config.LIVEKIT_URL, roomId: roomId.data };
  });

  await app.listen({ host: '0.0.0.0', port: config.PORT });
}

void startRoomService();
