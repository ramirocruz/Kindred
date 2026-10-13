import type { Server as HttpServer } from 'node:http';

import { Server } from 'socket.io';
import { z } from 'zod';

import { verifyRoomTicket } from '../auth/room-ticket.js';
import { serializeRoomState } from '../rooms/room-state.js';
import { RoomRegistry } from '../rooms/room-registry.js';

const joinPayloadSchema = z.object({
  roomId: z.string().trim().min(1).max(80),
  ticket: z.string().min(1),
});

const encryptedChatSchema = z.object({
  version: z.literal(1),
  iv: z.array(z.number().int().min(0).max(255)).length(12),
  ciphertext: z.array(z.number().int().min(0).max(255)).min(17).max(8016),
}).strict();

const chatPayloadSchema = z.object({
  id: z.string().uuid(),
  encrypted: encryptedChatSchema,
}).strict();

const playbackPayloadSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('play') }),
  z.object({ type: z.literal('pause') }),
  z.object({ positionSeconds: z.number().finite(), type: z.literal('seek') }),
]);

interface ConnectedMember {
  identity: string;
  roomId: string;
  expiresAt: number;
}

interface EncryptedChatMessage {
  id: string;
  author: string;
  senderId: string;
  encrypted: z.infer<typeof encryptedChatSchema>;
}

interface RoomLogger {
  info(data: Record<string, string>, message: string): void;
}

function emitRoomState(io: Server, roomId: string, registry: RoomRegistry): void {
  const room = registry.get(roomId);
  if (room) {
    io.to(roomId).emit('room:state', serializeRoomState(room));
  }
}

function leaveRoom(
  io: Server,
  members: Map<string, ConnectedMember>,
  registry: RoomRegistry,
  socketId: string,
): string | undefined {
  const member = members.get(socketId);
  if (!member) {
    return undefined;
  }

  members.delete(socketId);
  if (![...members.values()].some((other) => other.roomId === member.roomId && other.identity === member.identity)) {
    registry.leave(member.roomId, member.identity);
  }
  emitRoomState(io, member.roomId, registry);
  return member.roomId;
}

export function attachRoomSocket(
  server: HttpServer,
  origin: string,
  registry: RoomRegistry,
  logger: RoomLogger,
  roomTicketSecret: string,
): Server {
  const io = new Server(server, { cors: { origin } });
  const members = new Map<string, ConnectedMember>();
  const histories = new Map<string, EncryptedChatMessage[]>();
  const seenMessageIds = new Map<string, Set<string>>();

  io.on('connection', (socket) => {
    let lastMessageAt = 0;
    socket.on('room:join', (payload: unknown, acknowledge: (response: unknown) => void) => {
      if (typeof acknowledge !== 'function') return;
      const parsed = joinPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        acknowledge({ error: 'Invalid room join request.' });
        return;
      }

      const { roomId, ticket } = parsed.data;
      const claims = verifyRoomTicket(ticket, roomTicketSecret, Date.now());
      if (!claims || claims.roomId !== roomId) {
        acknowledge({ error: 'Room invitation is invalid or expired.' });
        return;
      }

      const previousRoomId = leaveRoom(io, members, registry, socket.id);
      if (previousRoomId && previousRoomId !== roomId) {
        socket.leave(previousRoomId);
      }
      socket.join(roomId);
      members.set(socket.id, { identity: claims.identity, roomId, expiresAt: claims.expiresAt });
      const room = registry.join(roomId, { displayName: claims.displayName, id: claims.identity }, Date.now());
      logger.info({ roomId, socketId: socket.id }, 'Room member joined');
      io.to(roomId).emit('room:state', serializeRoomState(room));
      acknowledge({ room: serializeRoomState(room) });
      socket.emit('chat:history', histories.get(roomId) ?? []);
    });

    socket.on('chat:send', (payload: unknown, acknowledge: (response: unknown) => void) => {
      if (typeof acknowledge !== 'function') return;
      const member = members.get(socket.id);
      const parsed = chatPayloadSchema.safeParse(payload);
      const author = member && registry.get(member.roomId)?.members.get(member.identity);
      if (!member || !author || !parsed.success || member.expiresAt <= Date.now()) {
        acknowledge({ error: 'Encrypted message rejected. Check your connection and invitation.' }); return;
      }
      if (Date.now() - lastMessageAt < 300) { acknowledge({ error: 'Please wait before sending another message.' }); return; }
      const seen = seenMessageIds.get(member.roomId) ?? new Set<string>();
      if (seen.has(parsed.data.id)) {
        acknowledge({ error: 'Duplicate encrypted message rejected.' }); return;
      }
      // Retain replay IDs for the room lifetime without unbounded memory growth.
      if (seen.size >= 10000) {
        acknowledge({ error: 'Room message limit reached. Create a new room to continue.' }); return;
      }
      lastMessageAt = Date.now();
      seen.add(parsed.data.id);
      seenMessageIds.set(member.roomId, seen);
      const message = { id: parsed.data.id, author: author.displayName, senderId: member.identity, encrypted: parsed.data.encrypted } satisfies EncryptedChatMessage;
      const history = [...(histories.get(member.roomId) ?? []), message].slice(-100);
      histories.set(member.roomId, history);
      io.to(member.roomId).emit('chat:message', message);
      acknowledge({ ok: true });
    });

    socket.on('room:playback', (payload: unknown, acknowledge: (response: unknown) => void) => {
      if (typeof acknowledge !== 'function') return;
      const member = members.get(socket.id);
      const parsed = playbackPayloadSchema.safeParse(payload);
      if (!member || !parsed.success) {
        acknowledge({ error: 'Invalid playback request.' });
        return;
      }

      const room = registry.applyPlayback(member.roomId, parsed.data, Date.now());
      if (!room) {
        acknowledge({ error: 'Room is unavailable.' });
        return;
      }

      io.to(member.roomId).emit('room:state', serializeRoomState(room));
      acknowledge({ room: serializeRoomState(room) });
    });

    socket.on('disconnect', () => {
      const roomId = leaveRoom(io, members, registry, socket.id);
      if (roomId) {
        if (!registry.get(roomId)) {
          histories.delete(roomId);
          seenMessageIds.delete(roomId);
        }
        logger.info({ roomId, socketId: socket.id }, 'Room member disconnected');
      }
    });
  });

  return io;
}
