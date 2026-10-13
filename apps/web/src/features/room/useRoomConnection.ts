import { useEffect, useRef, useState } from 'react';
import type { RoomSession } from './services/session';
import { encryptChat } from './services/chat-crypto';
import { EncryptedChatInbox } from './services/encrypted-chat-inbox';
import { BrowserRoom } from './services/browser-room';
import { peerOptions } from './services/peer-config';
import type { ChatMessage } from './chat';

export interface RoomConnection {
  chatStatus: string;
  roomName: string;
  hostId: string;
  members: { id: string; displayName: string }[];
  messages: ChatMessage[];
  streams: ReadonlyMap<string, MediaStream>;
  reaction: { emoji: string; id: number } | null;
  status: string;
  send: (text: string) => Promise<void>;
  react: (emoji: string) => void;
  setStream: (stream: MediaStream | null) => void;
}

export function useRoomConnection(session: RoomSession): RoomConnection {
  const controller = useRef<BrowserRoom | null>(null);
  const [members, setMembers] = useState<RoomConnection['members']>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState('Connecting…');
  const [chatStatus, setChatStatus] = useState('Chat encrypted');
  const [roomName, setRoomName] = useState(session.name);
  const [hostId, setHostId] = useState('');
  const [streams, setStreams] = useState<ReadonlyMap<string, MediaStream>>(new Map());
  const [reaction, setReaction] = useState<RoomConnection['reaction']>(null);
  const reactionId = useRef(0);

  useEffect(() => {
    setMessages([]); setMembers([]);
    const inbox = new EncryptedChatInbox({ key: session.chatKey, roomId: session.id, onMessages: setMessages,
      onError: () => setChatStatus('Some messages could not be decrypted. Check your invite link.') });
    let room: BrowserRoom | null = null;
    const start = (): void => {
      try {
        const options = peerOptions(import.meta.env.VITE_PEER_SERVER_URL || '',
          import.meta.env.VITE_ICE_SERVERS || '[]', import.meta.env.VITE_RELAY_ONLY === 'true');
        room = new BrowserRoom(session, options, {
          onState: (state) => { setMembers(state.members); setRoomName(state.name); setHostId(state.hostId); void inbox.receive('history', state.messages); },
          onStatus: setStatus, onStreams: setStreams,
          onReaction: (emoji) => setReaction({ emoji, id: ++reactionId.current }),
        });
        controller.current = room;
      } catch { setStatus('Configure the self-hosted signaling endpoint and ICE servers.'); }
    };
    // Avoid reserving PeerJS IDs during React StrictMode's throwaway mount.
    const startup = setTimeout(start, 0);
    const leave = (): void => { room?.close(); setStatus('Room left. Rejoin with your invitation.'); };
    window.addEventListener('pagehide', leave);
    return () => {
      clearTimeout(startup); window.removeEventListener('pagehide', leave);
      inbox.dispose(); room?.close(); controller.current = null;
    };
  }, [session]);

  async function send(text: string): Promise<void> {
    const room = controller.current;
    if (!room || status !== 'Connected') throw new Error('Wait until the room reconnects.');
    const id = crypto.randomUUID();
    const encrypted = await encryptChat(session.chatKey, text, { messageId: id, roomId: session.id, senderId: session.identity });
    if (room !== controller.current) throw new Error('Room left before sending.');
    await room.sendChat({ id, encrypted, senderId: session.identity, author: session.displayName });
  }
  return { chatStatus, roomName, hostId, members, messages, streams, reaction, status, send,
    react: (emoji) => controller.current?.react(emoji), setStream: (stream) => controller.current?.setStream(stream) };
}
