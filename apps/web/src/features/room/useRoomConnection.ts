import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { z } from 'zod';
import type { RoomSession } from './services/session';
import type { ChatMessage } from './chat';

const messageSchema = z.object({ id: z.string(), author: z.string(), text: z.string() });
const stateSchema = z.object({ members: z.array(z.object({ id: z.string(), displayName: z.string() })) });
export interface RoomConnection {
  members: { id: string; displayName: string }[];
  messages: ChatMessage[];
  status: string;
  send: (text: string) => Promise<void>;
}

export function useRoomConnection(session: RoomSession): RoomConnection {
  const socketRef = useRef<Socket | null>(null);
  const [members, setMembers] = useState<RoomConnection['members']>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState('Connecting…');
  useEffect(() => {
    const socket = io({ autoConnect: false });
    socketRef.current = socket;
    socket.on('connect', () => {
      setStatus('Joining…');
      socket.timeout(5000).emit('room:join', { roomId: session.id, ticket: session.ticket }, (error: Error | null, response: { error?: string }) => {
        setStatus(error ? 'Join timed out. Reopen the room.' : response.error ?? 'Connected');
      });
    });
    socket.on('room:state', (payload: unknown) => {
      const parsed = stateSchema.safeParse(payload);
      if (parsed.success) setMembers(parsed.data.members);
    });
    socket.on('chat:history', (payload: unknown) => {
      const parsed = z.array(messageSchema).safeParse(payload);
      if (parsed.success) setMessages(parsed.data);
    });
    socket.on('chat:message', (payload: unknown) => {
      const parsed = messageSchema.safeParse(payload);
      if (parsed.success) setMessages((previous) => [...previous, parsed.data].slice(-100));
    });
    const disconnected = (): void => { setStatus('Reconnecting…'); setMembers([]); };
    socket.on('disconnect', disconnected);
    socket.on('connect_error', disconnected);
    const pagehide = (): void => { socket.disconnect(); };
    const pageshow = (): void => { socket.connect(); };
    window.addEventListener('pagehide', pagehide);
    window.addEventListener('pageshow', pageshow);
    socket.connect();
    return () => {
      window.removeEventListener('pagehide', pagehide);
      window.removeEventListener('pageshow', pageshow);
      socket.removeAllListeners(); socket.disconnect(); socketRef.current = null;
    };
  }, [session]);

  async function send(text: string): Promise<void> {
    const socket = socketRef.current;
    if (!socket?.connected || status !== 'Connected') throw new Error('Wait until the room reconnects.');
    const result: { error?: string } = await socket.timeout(5000).emitWithAck('chat:send', { text });
    if (result.error) throw new Error(result.error);
  }
  return { members, messages, status, send };
}
