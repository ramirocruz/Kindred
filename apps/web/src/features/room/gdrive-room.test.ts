import { EventEmitter } from 'node:events';
import { jest } from '@jest/globals';
import type { PeerOptions } from 'peerjs';
import type { RoomObserver } from './services/browser-room';
import { openRoom } from './services/session';
import type { DriveAction, PlaybackState, Presentation } from './services/gdrive-protocol';

// Transport fixture only: application frames still use real Web Crypto.
class Connection extends EventEmitter {
  public open = false;
  public other?: Connection;
  constructor(public readonly peer: string, public readonly connectionId: string) { super(); }
  public send(payload: unknown): void { queueMicrotask(() => { if (this.other?.open) this.other.emit('data', payload); }); }
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
  private connections: Connection[] = [];
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

describe('authenticated guest GDrive controls', () => {
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
