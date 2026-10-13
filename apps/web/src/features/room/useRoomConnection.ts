import { useEffect, useRef, useState } from 'react';
import type { RoomSession } from './services/session';
import { encryptChat } from './services/chat-crypto';
import { EncryptedChatInbox } from './services/encrypted-chat-inbox';
import { BrowserRoom } from './services/browser-room';
import { peerOptions } from './services/peer-config';
import type { ChatMessage } from './chat';
import { GDriveBridge } from './services/gdrive-bridge';
import type { DriveAction, PlaybackState, Presentation } from './services/gdrive-protocol';

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
  presentation?: Presentation;
  screen: MediaStream | null;
  driveError: string;
  controlDrive: (command: DriveAction) => Promise<PlaybackState>;
  stopDrive: () => Promise<void>;
}

export function useRoomConnection(session: RoomSession): RoomConnection {
  const controller = useRef<BrowserRoom | null>(null);
  const bridge = useRef<GDriveBridge | null>(null);
  const [members, setMembers] = useState<RoomConnection['members']>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState('Connecting…');
  const [chatStatus, setChatStatus] = useState('Chat encrypted');
  const [roomName, setRoomName] = useState(session.name);
  const [hostId, setHostId] = useState('');
  const [streams, setStreams] = useState<ReadonlyMap<string, MediaStream>>(new Map());
  const [reaction, setReaction] = useState<RoomConnection['reaction']>(null);
  const reactionId = useRef(0);
  const [presentation, setPresentation] = useState<Presentation>();
  const [screen, setScreen] = useState<MediaStream | null>(null);
  const [driveError, setDriveError] = useState('');

  useEffect(() => {
    setMessages([]); setMembers([]);
    const inbox = new EncryptedChatInbox({ key: session.chatKey, roomId: session.id, onMessages: setMessages,
      onError: () => setChatStatus('Some messages could not be decrypted. Check your invite link.') });
    let room: BrowserRoom | null = null;
    let connected = false;
    const drive = new GDriveBridge(session.id, session.identity, {
      ready: () => connected,
      share: async (next, stream) => {
        if (!room) throw new Error('Room not ready.');
        // Clear local capture immediately on revoke, even during authority outage.
        if (!stream) room.setScreen(null);
        await room.updatePresentation(next);
        if (stream) room.setScreen(stream);
        setDriveError('');
      },
      update: async (next) => { if (room) await room.updatePresentation(next); },
      error: setDriveError,
    });
    bridge.current = drive;
    const start = (): void => {
      try {
        const options = peerOptions(import.meta.env.VITE_PEER_SERVER_URL || '',
          import.meta.env.VITE_ICE_SERVERS || '[]', import.meta.env.VITE_RELAY_ONLY === 'true');
        room = new BrowserRoom(session, options, {
          onState: (state) => { setMembers(state.members); setRoomName(state.name); setHostId(state.hostId); setPresentation(state.presentation); drive.reconcile(state.presentation); void inbox.receive('history', state.messages); },
          onStatus: (next) => { connected = next === 'Connected'; setStatus(next); }, onStreams: setStreams,
          onScreen: setScreen, onDriveControl: (command) => drive.control(command),
          onReaction: (emoji) => setReaction({ emoji, id: ++reactionId.current }),
        });
        controller.current = room;
      } catch { setStatus('Connection configuration is invalid. Check signaling and ICE settings.'); }
    };
    // Avoid reserving PeerJS IDs during React StrictMode's throwaway mount.
    const startup = setTimeout(start, 0);
    const leave = (): void => { drive.close(); room?.close(); setStatus('Room left. Rejoin with your invitation.'); };
    window.addEventListener('pagehide', leave);
    return () => {
      clearTimeout(startup); window.removeEventListener('pagehide', leave);
      inbox.dispose(); drive.close(); bridge.current = null; room?.close(); controller.current = null;
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
    ...(presentation ? { presentation } : {}), screen, driveError,
    controlDrive: async (command) => { if (!controller.current) throw new Error('Room not ready.'); return controller.current.controlDrive(command); },
    stopDrive: async () => { await bridge.current?.stop(); },
    react: (emoji) => controller.current?.react(emoji), setStream: (stream) => controller.current?.setStream(stream) };
}
