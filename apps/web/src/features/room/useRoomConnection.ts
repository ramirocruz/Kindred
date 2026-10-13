import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { z } from 'zod';
import type { RoomSession } from './services/session';
import { encryptChat } from './services/chat-crypto';
import { EncryptedChatInbox } from './services/encrypted-chat-inbox';
import type { ChatMessage } from './chat';

const stateSchema = z.object({ members: z.array(z.object({ id: z.string(), displayName: z.string() })) });

export interface RoomConnection {
  chatStatus: string;
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
  const [chatStatus, setChatStatus] = useState('Chat encrypted');

  useEffect(() => {
    let disposed = false;
    setMessages([]);
    setChatStatus('Chat encrypted');
    const inbox = new EncryptedChatInbox({
      key: session.chatKey, roomId: session.id, onMessages: setMessages,
      onError: () => setChatStatus('Some messages could not be decrypted. Check your invite link.'),
    });
    const socket = io({ autoConnect: false });
    socketRef.current = socket;
    socket.on('connect', () => {
      setStatus('Joining…');
      socket.timeout(5000).emit('room:join', { roomId: session.id, ticket: session.ticket }, (error: Error | null, response: { error?: string }) => {
        if (disposed) return;
        setStatus(error ? 'Join timed out. Reopen the room.' : response.error ?? 'Connected');
      });
    });
    socket.on('room:state', (payload: unknown) => {
      const parsed = stateSchema.safeParse(payload);
      if (parsed.success) setMembers(parsed.data.members);
    });
    socket.on('chat:history', (payload: unknown) => {
      void inbox.receive('history', payload);
    });
    socket.on('chat:message', (payload: unknown) => {
      void inbox.receive('message', payload);
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
      disposed = true;
      inbox.dispose();
      window.removeEventListener('pagehide', pagehide);
      window.removeEventListener('pageshow', pageshow);
      socket.removeAllListeners(); socket.disconnect(); socketRef.current = null;
    };
  }, [session]);

  async function send(text: string): Promise<void> {
    const socket = socketRef.current;
    if (!socket?.connected || status !== 'Connected') throw new Error('Wait until the room reconnects.');
    const id = crypto.randomUUID();
    const encrypted = await encryptChat(session.chatKey, text, { messageId: id, roomId: session.id, senderId: session.identity });
    if (socket !== socketRef.current || !socket.connected) throw new Error('Room disconnected before sending.');
    const result: { error?: string } = await socket.timeout(5000).emitWithAck('chat:send', { encrypted, id });
    if (result.error) throw new Error(result.error);
  }
  return { chatStatus, members, messages, status, send };
}
