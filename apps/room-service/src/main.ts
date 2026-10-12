import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';

import { loadRoomServiceConfig } from './config.js';
import { verifyRoomTicket } from './auth/room-ticket.js';
import { createParticipantToken } from './livekit-token.js';
import { RoomRegistry } from './rooms/room-registry.js';
import { attachRoomSocket } from './transport/socket-server.js';

const sessionBodySchema = z.object({
  displayName: z.string().trim().min(1).max(24),
});

export async function startRoomService(): Promise<void> {
  const config = loadRoomServiceConfig(process.env);
  const app = Fastify({ logger: true });
  const registry = new RoomRegistry();

  await app.register(cors, { origin: config.WEB_ORIGIN });
  attachRoomSocket(app.server, config.WEB_ORIGIN, registry, app.log, config.ROOM_TICKET_SECRET);

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

    const liveKitToken = await createParticipantToken(config, roomId.data, claims.identity);
    return { identity: claims.identity, liveKitToken, liveKitUrl: config.LIVEKIT_URL, roomId: roomId.data };
  });

  await app.listen({ host: '0.0.0.0', port: config.PORT });
}

void startRoomService();
