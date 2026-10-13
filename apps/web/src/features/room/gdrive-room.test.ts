import { EventEmitter } from 'node:events';
import { jest } from '@jest/globals';
import type { PeerOptions } from 'peerjs';
import type { RoomObserver } from './services/browser-room';
import { openRoom } from './services/session';
import type { RoomSession } from './services/session';
import type { BrowserRoomState } from './services/browser-room-state';
import { encryptChat } from './services/chat-crypto';
import { openRoomFrame, sealRoomFrame } from './services/room-frame';
import type { DriveAction, PlaybackState, Presentation } from './services/gdrive-protocol';

// Transport fixture only: application frames still use real Web Crypto.
class Connection extends EventEmitter {
  public open = false;
  public other?: Connection;
  public sent: unknown[] = [];
  public dropNext = false;
  constructor(public readonly peer: string, public readonly connectionId: string) { super(); }
  public send(payload: unknown): void {
    this.sent.push(payload);
    if (this.dropNext) { this.dropNext = false; return; }
    queueMicrotask(() => { if (this.other?.open) this.other.emit('data', payload); });
  }
  public close(): void {
    if (!this.open) return;
    this.open = false; this.emit('close');
    if (this.other?.open) { this.other.open = false; this.other.emit('close'); }
  }
}
class FixturePeer extends EventEmitter {
  public static peers = new Map<string, FixturePeer>();
  public open = false;
  public destroyed = false;
  public disconnected = false;
  public connections: Connection[] = [];
  constructor(public readonly id: string, _options: PeerOptions) {
    super();
    queueMicrotask(() => {
      if (this.destroyed) return;
      if (FixturePeer.peers.has(id)) { this.emit('error', { type: 'unavailable-id' }); return; }
      FixturePeer.peers.set(id, this); this.open = true; this.emit('open', id);
    });
  }
  public connect(id: string): Connection {
    const connection = new Connection(id, crypto.randomUUID()); this.connections.push(connection);
    queueMicrotask(() => {
      const peer = FixturePeer.peers.get(id);
      if (!peer) { connection.emit('error', new Error('Missing peer')); return; }
      const other = new Connection(this.id, connection.connectionId); peer.connections.push(other);
      connection.other = other; other.other = connection;
      peer.emit('connection', other); connection.open = true; other.open = true;
      other.emit('open'); connection.emit('open');
    });
    return connection;
  }
  public call(): EventEmitter & { close: () => void } {
    const call = Object.assign(new EventEmitter(), { close: () => call.emit('close') });
    return call;
  }
  public reconnect(): void { this.disconnected = false; }
  public destroy(): void {
    this.destroyed = true; this.open = false;
    if (FixturePeer.peers.get(this.id) === this) FixturePeer.peers.delete(this.id);
    for (const connection of this.connections) connection.close();
  }
}
jest.unstable_mockModule('peerjs', () => ({ default: FixturePeer }));
const { BrowserRoom } = await import('./services/browser-room');
const flush = async (): Promise<void> => {
  for (let index = 0; index < 60; index++) await new Promise<void>((resolve) => setImmediate(resolve));
};
const observer = (): RoomObserver => ({ onState: jest.fn(), onStatus: jest.fn(), onReaction: jest.fn(), onStreams: jest.fn(), onScreen: jest.fn(),
  onDriveControl: jest.fn<(command: DriveAction) => Promise<PlaybackState>>(async (command) => ({ time: command.time ?? 25, duration: 100, paused: command.action === 'pause' })) });

interface Pair {
  host: InstanceType<typeof BrowserRoom>; guest: InstanceType<typeof BrowserRoom>;
  hostSession: RoomSession; guestSession: RoomSession; hostObserver: RoomObserver; guestObserver: RoomObserver;
  states: BrowserRoomState[]; close: () => void;
}
async function pair(): Promise<Pair> {
  const hostSession = await openRoom({ displayName: 'Host', name: 'Test', reactions: true });
  const guestSession = await openRoom({ displayName: 'Guest', name: 'Test', reactions: true },
    { invite: hostSession.invite, chatInviteSecret: hostSession.chatInviteSecret });
  const hostObserver = observer(), guestObserver = observer(), states: BrowserRoomState[] = [];
  guestObserver.onState = (state) => states.push(state);
  const host = new BrowserRoom(hostSession, {}, hostObserver); await flush();
  const guest = new BrowserRoom(guestSession, {}, guestObserver); await flush();
  return { host, guest, hostSession, guestSession, hostObserver, guestObserver, states,
    close: () => { guest.close(); host.close(); FixturePeer.peers.clear(); } };
}

describe('authenticated guest GDrive controls', () => {
  it('sends one small playback delta, retaining chat without retransmitting it', async () => {
    const rooms = await pair();
    try {
      const id = crypto.randomUUID();
      await rooms.host.sendChat({ id, author: 'Host', senderId: rooms.hostSession.identity,
        encrypted: await encryptChat(rooms.hostSession.chatKey, 'Existing history', { messageId: id, roomId: rooms.hostSession.id, senderId: rooms.hostSession.identity }) });
      await flush();
      const history = rooms.states.at(-1)?.messages;
      const direct = FixturePeer.peers.get(rooms.hostSession.identity)?.connections.find((connection) => connection.peer === rooms.guestSession.identity && connection.open);
      const alias = FixturePeer.peers.get(`kindred-room-${rooms.hostSession.id}`)?.connections[0];
      expect(direct).toBeDefined();
      const start = direct?.sent.length ?? 0, aliasStart = alias?.sent.length ?? 0;
      await rooms.host.updatePresentation({ ownerId: rooms.hostSession.identity, epoch: crypto.randomUUID(), title: 'Movie', playback: { time: 30, duration: 100, paused: false }, error: '' });
      await flush();
      expect(direct?.sent.length).toBe(start + 1);
      expect(alias?.sent.length).toBe(aliasStart);
      const result = await openRoomFrame(rooms.guestSession.chatKey, rooms.hostSession.id,
        `${rooms.hostSession.identity}/${direct?.connectionId}`, rooms.guestSession.identity, direct?.sent.at(-1));
      expect(result.body).toMatchObject({ kind: 'playback' });
      expect(JSON.stringify(result.body)).not.toContain('messages');
      expect(Buffer.byteLength(JSON.stringify(direct?.sent.at(-1)))).toBeLessThan(2048);
      expect(rooms.states.at(-1)?.messages).toBe(history);
      expect(rooms.states.at(-1)?.presentation?.playback?.time).toBe(30);
      const share = rooms.states.at(-1)?.presentation;
      if (!share) throw new Error('Missing presentation');
      await rooms.host.updatePresentation(share); await flush();
      expect(direct?.sent.length).toBe(start + 1);
    } finally { rooms.close(); }
  });
  it('repairs a missed playback delta with a complete authoritative snapshot', async () => {
    const rooms = await pair();
    try {
      const direct = FixturePeer.peers.get(rooms.hostSession.identity)?.connections.find((connection) => connection.peer === rooms.guestSession.identity && connection.open);
      expect(direct).toBeDefined(); if (!direct) throw new Error('Missing mesh');
      direct.dropNext = true;
      const share: Presentation = { ownerId: rooms.hostSession.identity, epoch: crypto.randomUUID(), title: 'Movie', playback: { time: 1, duration: 100, paused: false }, error: '' };
      await rooms.host.updatePresentation(share); await flush();
      expect(rooms.states.at(-1)?.presentation).toBeUndefined();
      await rooms.host.updatePresentation({ ...share, playback: { time: 40, duration: 100, paused: true } }); await flush();
      expect(rooms.states.at(-1)?.presentation?.playback?.time).toBe(40);
      expect(rooms.states.at(-1)?.sequence).toBeGreaterThan(1);
    } finally { rooms.close(); }
  });
  it('falls back to full snapshots for guests that do not advertise delta support', async () => {
    const rooms = await pair();
    try {
      const direct = FixturePeer.peers.get(rooms.hostSession.identity)?.connections.find((connection) => connection.peer === rooms.guestSession.identity && connection.open);
      if (!direct?.other) throw new Error('Missing mesh');
      const hello = await sealRoomFrame(rooms.guestSession.chatKey, rooms.hostSession.id,
        `${rooms.guestSession.identity}/${direct.connectionId}`, rooms.hostSession.identity, { kind: 'hello', displayName: 'Guest' });
      direct.other.send(hello); await flush();
      await rooms.host.updatePresentation({ ownerId: rooms.hostSession.identity, epoch: crypto.randomUUID(), title: 'Movie', playback: null, error: '' }); await flush();
      const result = await openRoomFrame(rooms.guestSession.chatKey, rooms.hostSession.id,
        `${rooms.hostSession.identity}/${direct.connectionId}`, rooms.guestSession.identity, direct.sent.at(-1));
      expect(result.body).toMatchObject({ kind: 'snapshot' });
      expect(rooms.states.at(-1)?.presentation?.title).toBe('Movie');
    } finally { rooms.close(); }
  });
  it('keeps pause and reactions dispatching while a guest seek is pending', async () => {
    const rooms = await pair();
    let release: (() => void) | undefined;
    const deferred = new Promise<void>((resolve) => { release = resolve; });
    const actions: string[] = [];
    rooms.hostObserver.onDriveControl = async (command) => {
      actions.push(command.action); if (command.action === 'seek') await deferred;
      return { time: 30, duration: 100, paused: command.action === 'pause' };
    };
    try {
      await rooms.host.updatePresentation({ ownerId: rooms.hostSession.identity, epoch: crypto.randomUUID(), title: 'Movie', playback: null, error: '' }); await flush();
      const seek = rooms.guest.controlDrive({ action: 'seek', time: 30 }); await flush();
      const pause = rooms.guest.controlDrive({ action: 'pause' });
      rooms.guest.react('👏'); await flush();
      expect(actions).toEqual(['seek', 'pause']);
      expect(rooms.hostObserver.onReaction).toHaveBeenCalledWith('👏');
      await expect(pause).resolves.toMatchObject({ paused: true });
      release?.(); await expect(seek).resolves.toMatchObject({ time: 30 });
    } finally { release?.(); rooms.close(); }
  });
  it('rejects a late source result after unlink instead of restoring the old share', async () => {
    const rooms = await pair();
    let release: (() => void) | undefined;
    const deferred = new Promise<void>((resolve) => { release = resolve; });
    rooms.hostObserver.onDriveControl = async () => { await deferred; return { time: 30, duration: 100, paused: false }; };
    try {
      await rooms.host.updatePresentation({ ownerId: rooms.hostSession.identity, epoch: crypto.randomUUID(), title: 'Movie', playback: null, error: '' }); await flush();
      const seek = rooms.guest.controlDrive({ action: 'seek', time: 30 });
      const rejected = expect(seek).rejects.toThrow('shared tab changed'); await flush();
      await rooms.host.updatePresentation(null); await flush();
      release?.(); await rejected;
      expect(rooms.states.at(-1)?.presentation).toBeUndefined();
    } finally { release?.(); rooms.close(); }
  });
  it('routes guest seeks to a non-host presenter and acknowledges actual playback', async () => {
    const hostSession = await openRoom({ displayName: 'Host', name: 'Test', reactions: true });
    const presenterSession = await openRoom({ displayName: 'Presenter', name: 'Test', reactions: true },
      { invite: hostSession.invite, chatInviteSecret: hostSession.chatInviteSecret });
    const guestSession = await openRoom({ displayName: 'Guest', name: 'Test', reactions: true },
      { invite: hostSession.invite, chatInviteSecret: hostSession.chatInviteSecret });
    const hostObserver = observer(), presenterObserver = observer(), guestObserver = observer();
    const host = new BrowserRoom(hostSession, {}, hostObserver); await flush();
    const presenter = new BrowserRoom(presenterSession, {}, presenterObserver); await flush();
    const guest = new BrowserRoom(guestSession, {}, guestObserver); await flush();
    try {
      const share: Presentation = { ownerId: presenterSession.identity, epoch: crypto.randomUUID(), title: 'Drive video', playback: null, error: '' };
      await presenter.updatePresentation(share); await flush();
      const result = await guest.controlDrive({ action: 'seek', time: 45 });
      expect(result.time).toBe(45);
      expect(presenterObserver.onDriveControl).toHaveBeenCalledWith({ action: 'seek', time: 45 });
      expect(hostObserver.onDriveControl).not.toHaveBeenCalled();
      await expect(guest.updatePresentation(null)).rejects.toThrow('Stop the current presentation');
      await presenter.updatePresentation(null); await flush();
      await expect(guest.controlDrive({ action: 'pause' })).rejects.toThrow('No Drive tab');
    } finally { guest.close(); presenter.close(); host.close(); FixturePeer.peers.clear(); }
  });
});
