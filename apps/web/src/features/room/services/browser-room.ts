import Peer, { type DataConnection, type PeerOptions } from 'peerjs';
import { z } from 'zod';
import type { RoomSession } from './session';
import { admitMember, browserRoomSchema, chatWireSchema, eldestSuccessor, isNewerSnapshot, promoteSuccessor,
  type BrowserRoomState, type ChatWireMessage } from './browser-room-state';
import { openRoomFrame, sealRoomFrame } from './room-frame';
import { PeerMedia } from './peer-media';
import { PeerScreen } from './peer-screen';
import { canUpdatePresentation, driveActionSchema, playbackSchema, presentationSchema,
  type DriveAction, type PlaybackState, type Presentation } from './gdrive-protocol';

const TIMEOUT = 7000;
const messageSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('hello'), displayName: z.string().trim().min(1).max(24), playbackDeltas: z.boolean().optional() }),
  z.object({ kind: z.literal('snapshot'), state: browserRoomSchema }),
  z.object({ kind: z.literal('state-request') }),
  z.object({ kind: z.literal('playback'), roomId: z.string().uuid(), hostId: z.string().uuid(),
    term: z.number().int().positive(), previousSequence: z.number().int().nonnegative(), sequence: z.number().int().positive(),
    presentation: presentationSchema.nullable() }),
  z.object({ kind: z.literal('ping'), term: z.number().int().nonnegative(), authority: z.boolean() }),
  z.object({ kind: z.literal('chat'), message: chatWireSchema }),
  z.object({ kind: z.literal('ack'), id: z.string().uuid(), error: z.string().max(250).optional() }),
  z.object({ kind: z.literal('presentation'), id: z.string().uuid(), presentation: presentationSchema.nullable() }),
  z.object({ kind: z.literal('drive-control'), id: z.string().uuid(), epoch: z.string().uuid(), command: driveActionSchema }),
  z.object({ kind: z.literal('drive-result'), id: z.string().uuid(), epoch: z.string().uuid(), state: playbackSchema.optional(), error: z.string().max(250).optional() }),
  z.object({ kind: z.literal('leave') }),
  z.object({ kind: z.literal('reaction'), emoji: z.enum(['😂', '❤️', '😱', '👏', '🍿']) }),
  z.object({ kind: z.literal('media'), enabled: z.boolean() }),
]);
type Message = z.infer<typeof messageSchema>;
interface Channel {
  connection: DataConnection;
  localId: string;
  authenticated: boolean;
  playbackDeltas: boolean;
  received: Set<string>;
  incoming: Promise<void>;
  outgoing: Promise<void>;
  syncRequestedAt?: number;
}
export interface RoomObserver {
  onState: (state: BrowserRoomState) => void;
  onStatus: (status: string) => void;
  onReaction: (emoji: string) => void;
  onStreams: (streams: ReadonlyMap<string, MediaStream>) => void;
  onScreen: (stream: MediaStream | null) => void;
  onDriveControl: (command: DriveAction) => Promise<PlaybackState>;
}

/** PeerServer owns connection IDs only; application authority lives in browsers. */
export class BrowserRoom {
  private peer: Peer;
  private alias: Peer | null = null;
  private anchor: Channel | null = null;
  private state: BrowserRoomState | null = null;
  private channels = new Map<string, Channel>();
  private aliasChannels = new Map<DataConnection, Channel>();
  private lastSeen = new Map<string, number>();
  private lastAuthoritySeen = 0;
  private closed = false;
  private interval: ReturnType<typeof setInterval>;
  private lastDiscovery = 0;
  private startedAt = Date.now();
  private acquiring = false;
  private seenChat = new Set<string>();
  private pending = new Map<string, { resolve: () => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private media: PeerMedia;
  private screen: PeerScreen;
  private drivePending = new Map<string, { owner: string; epoch: string; resolve: (state: PlaybackState) => void;
    reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private driveLimits = new Map<string, { time: number; count: number }>();
  private activeDriveControls = 0;

  constructor(private readonly session: RoomSession, private readonly options: PeerOptions, private readonly observer: RoomObserver) {
    this.peer = new Peer(session.identity, options);
    this.media = new PeerMedia(this.peer, (id) => Boolean(this.channels.get(id)?.authenticated), observer.onStreams);
    this.screen = new PeerScreen(this.peer, session.identity, (id) => Boolean(this.channels.get(id)?.authenticated), observer.onScreen);
    this.peer.on('open', () => {
      if (session.creator && !this.state) {
        this.state = { id: session.id, name: session.name, reactions: session.reactions, hostId: session.identity,
          term: 1, sequence: 0, nextOrder: 2, members: [{ id: session.identity, displayName: session.displayName, order: 1 }], messages: [] };
        this.acquire();
      } else this.discover();
    });
    this.peer.on('connection', (connection) => this.attach(connection, session.identity, false));
    this.peer.on('call', (call) => {
      if (call.metadata?.kind === 'gdrive') this.screen.receive(call);
      else this.media.receive(call);
    });
    this.peer.on('error', (error) => {
      if (error.type !== 'peer-unavailable') this.observer.onStatus('Connection unavailable. Check signaling settings.');
    });
    this.peer.on('disconnected', () => {
      this.release();
      if (!this.closed) this.observer.onStatus('Signaling disconnected; room updates paused.');
    });
    this.interval = setInterval(() => this.tick(), 1000);
  }

  private get roomAddress(): string { return `kindred-room-${this.session.id}`; }
  private get authority(): boolean { return Boolean(this.alias?.open && !this.alias.disconnected && !this.alias.destroyed && this.state?.hostId === this.session.identity); }

  private attach(connection: DataConnection, localId: string, anchor: boolean): Channel {
    const channel: Channel = { connection, localId, authenticated: false, playbackDeltas: false, received: new Set(), incoming: Promise.resolve(), outgoing: Promise.resolve() };
    if (anchor) this.anchor = channel;
    else if (localId === this.session.identity) {
      const existing = this.channels.get(connection.peer);
      if (existing && existing.connection !== connection && (existing.connection.open || this.session.identity < connection.peer)) {
        connection.close(); return channel;
      }
      existing?.connection.close();
      this.channels.set(connection.peer, channel);
    } else this.aliasChannels.set(connection, channel);
    const expiry = setTimeout(() => { if (!channel.authenticated) connection.close(); }, TIMEOUT);
    connection.on('open', () => { void this.sendFrame(channel, { kind: 'hello', displayName: this.session.displayName, playbackDeltas: true }); });
    connection.on('data', (payload: unknown) => {
      channel.incoming = channel.incoming.then(async () => {
        if (this.closed || !connection.open) return;
        const frame = await openRoomFrame(this.session.chatKey, this.session.id, `${connection.peer}/${connection.connectionId}`, localId, payload);
        if (channel.received.has(frame.id)) return;
        if (channel.received.size >= 10000) { connection.close(); return; }
        channel.received.add(frame.id);
        const message = messageSchema.parse(frame.body);
        if (message.kind !== 'hello' && message.kind !== 'snapshot' && !channel.authenticated) return;
        await this.receive(channel, message);
      }).catch(() => { connection.close(); });
    });
    const close = (): void => {
      clearTimeout(expiry);
      this.aliasChannels.delete(connection);
      if (this.anchor === channel) this.anchor = null;
      if (this.channels.get(connection.peer) === channel) {
        this.channels.delete(connection.peer);
        this.lastSeen.delete(connection.peer);
        this.media.remove(connection.peer);
        this.screen.remove(connection.peer);
        if (this.authority) this.removeMember(connection.peer);
      }
    };
    connection.on('close', close);
    connection.on('error', close);
    return channel;
  }

  private sendFrame(channel: Channel, body: Message): Promise<void> {
    channel.outgoing = channel.outgoing.then(async () => {
      if (!channel.connection.open || this.closed) return;
      const frame = await sealRoomFrame(this.session.chatKey, this.session.id,
        `${channel.localId}/${channel.connection.connectionId}`, channel.connection.peer, body);
      if (channel.connection.open && !this.closed) channel.connection.send(frame);
    }).catch(() => { channel.connection.close(); });
    return channel.outgoing;
  }

  private async receive(channel: Channel, message: Message): Promise<void> {
    const remoteId = channel.connection.peer;
    if (message.kind === 'hello') {
      channel.playbackDeltas = message.playbackDeltas === true;
      if (channel.localId === this.roomAddress && this.authority && this.state) {
        this.state = admitMember(this.state, remoteId, message.displayName);
        channel.authenticated = true;
        this.lastSeen.set(remoteId, Date.now());
        this.publish();
      } else if (remoteId !== this.roomAddress && this.state?.members.some((member) => member.id === remoteId)) {
        channel.authenticated = true;
        this.lastSeen.set(remoteId, Date.now());
        void this.sendFrame(channel, { kind: 'media', enabled: this.media.enabled });
        if (this.authority && this.state) void this.sendFrame(channel, { kind: 'snapshot', state: this.state });
      }
      return;
    }
    if (message.kind === 'snapshot') {
      const incoming = message.state;
      const fromAnchor = channel === this.anchor && remoteId === this.roomAddress;
      if (!fromAnchor && (!channel.authenticated || remoteId !== this.state?.hostId || incoming.hostId !== remoteId || incoming.term !== this.state.term)) return;
      if (incoming.id !== this.session.id || !incoming.members.some((member) => member.id === this.session.identity)) return;
      if (this.state && !isNewerSnapshot(this.state, incoming)) return;
      if (fromAnchor) { channel.authenticated = true; this.release(); }
      this.state = incoming;
      this.screen.setPresentation(incoming.presentation);
      incoming.messages.forEach((item) => this.seenChat.add(item.id));
      this.lastSeen.set(incoming.hostId, Date.now());
      this.lastAuthoritySeen = Date.now();
      this.observer.onState(incoming);
      this.observer.onStatus('Connected');
      this.connectMembers();
      return;
    }
    if (!channel.authenticated || !this.state) return;
    this.lastSeen.set(remoteId, Date.now());
    if (message.kind === 'state-request' && this.authority) {
      if (Date.now() - (channel.syncRequestedAt ?? 0) < 1000) return;
      channel.syncRequestedAt = Date.now();
      void this.sendFrame(channel, { kind: 'snapshot', state: this.state });
      return;
    }
    if (message.kind === 'playback') {
      const trusted = remoteId === this.state.hostId || (channel === this.anchor && remoteId === this.roomAddress);
      if (!trusted || message.roomId !== this.state.id || message.hostId !== this.state.hostId || message.term !== this.state.term) return;
      if (message.sequence <= this.state.sequence) return;
      // Never apply a delta across a missed membership/chat commit or a channel switch.
      if (message.previousSequence !== this.state.sequence || message.sequence !== message.previousSequence + 1
        || (message.presentation && !this.state.members.some((member) => member.id === message.presentation?.ownerId))) {
        void this.sendFrame(channel, { kind: 'state-request' }); return;
      }
      const { presentation: previous, ...rest } = this.state;
      void previous;
      this.state = { ...rest, sequence: message.sequence, ...(message.presentation ? { presentation: message.presentation } : {}) };
      this.lastAuthoritySeen = Date.now();
      this.screen.setPresentation(this.state.presentation);
      this.observer.onState(this.state);
      this.observer.onStatus('Connected');
      return;
    }
    if (message.kind === 'ping') {
      if (remoteId === this.state.hostId && message.term === this.state.term && message.authority) this.lastAuthoritySeen = Date.now();
      if (remoteId === this.state.hostId && message.term === this.state.term && !this.authority && !this.anchor?.connection.open) this.discover();
      return;
    }
    if (message.kind === 'leave') { if (this.authority) this.removeMember(remoteId); channel.connection.close(); return; }
    if (message.kind === 'chat' && this.authority) {
      const member = this.state.members.find((item) => item.id === remoteId);
      if (!member || message.message.senderId !== remoteId || message.message.author !== member.displayName) return;
      this.commitChat(message.message);
      await this.sendFrame(channel, { kind: 'ack', id: message.message.id });
    }
    if (message.kind === 'ack' && remoteId === this.state.hostId) {
      const pending = this.pending.get(message.id);
      if (pending) { clearTimeout(pending.timer); this.pending.delete(message.id); message.error ? pending.reject(new Error(message.error)) : pending.resolve(); }
    }
    if (message.kind === 'presentation' && this.authority) {
      try {
        this.commitPresentation(message.presentation, remoteId);
        await this.sendFrame(channel, { kind: 'ack', id: message.id });
      } catch (error) {
        await this.sendFrame(channel, { kind: 'ack', id: message.id, error: error instanceof Error ? error.message : 'Sharing failed.' });
      }
    }
    if (message.kind === 'drive-control') {
      const share = this.state.presentation;
      if (!share || share.ownerId !== this.session.identity || share.epoch !== message.epoch) return;
      const previous = this.driveLimits.get(remoteId);
      const limit = previous && Date.now() - previous.time < 1000 ? previous : { time: Date.now(), count: 0 };
      this.driveLimits.set(remoteId, limit); limit.count++;
      if (limit.count > 5 || this.activeDriveControls >= 12) {
        void this.sendFrame(channel, { kind: 'drive-result', id: message.id, epoch: message.epoch, error: 'Too many playback requests. Try again shortly.' });
        return;
      }
      this.activeDriveControls++;
      // Keep authentication/decryption ordered, not slow source play/seek completion.
      void (async () => {
        try {
          const state = await this.observer.onDriveControl(message.command);
          if (this.closed || this.state?.presentation?.epoch !== message.epoch) throw new Error('The shared tab changed.');
          await this.sendFrame(channel, { kind: 'drive-result', id: message.id, epoch: message.epoch, state });
        } catch (error) {
          await this.sendFrame(channel, { kind: 'drive-result', id: message.id, epoch: message.epoch,
            error: error instanceof Error ? error.message.slice(0, 250) : 'Playback failed.' });
        } finally { this.activeDriveControls--; }
      })();
    }
    if (message.kind === 'drive-result') {
      const pending = this.drivePending.get(message.id);
      if (pending && pending.owner === remoteId && pending.epoch === message.epoch) {
        clearTimeout(pending.timer); this.drivePending.delete(message.id);
        if (message.state && this.state.presentation?.epoch === message.epoch) pending.resolve(message.state);
        else pending.reject(new Error(message.error || 'The shared tab changed.'));
      }
    }
    if (message.kind === 'reaction' && this.state.reactions) {
      this.observer.onReaction(message.emoji);
      if (this.authority) this.broadcast(message, remoteId);
    }
    if (message.kind === 'media') {
      this.media.setRemote(remoteId, message.enabled);
    }
  }

  private connectMembers(): void {
    if (!this.state || !this.peer.open) return;
    for (const member of this.state.members) {
      if (member.id !== this.session.identity && this.session.identity < member.id && !this.channels.has(member.id)) {
        this.attach(this.peer.connect(member.id, { reliable: true }), this.session.identity, false);
      }
    }
    for (const [id, channel] of this.channels) {
      if (!this.state.members.some((member) => member.id === id)) channel.connection.close();
      else if (!channel.authenticated && channel.connection.open) void this.sendFrame(channel, { kind: 'hello', displayName: this.session.displayName, playbackDeltas: true });
    }
    this.screen.sync(this.channels.keys());
  }

  private broadcast(message: Message, except?: string): void {
    for (const [id, channel] of this.channels) if (channel.authenticated && id !== except) void this.sendFrame(channel, message);
  }

  private publish(previousSequence?: number): void {
    if (!this.state || !this.authority) return;
    this.lastAuthoritySeen = Date.now();
    this.screen.setPresentation(this.state.presentation);
    this.observer.onState(this.state);
    this.observer.onStatus('Connected');
    const message: Message = previousSequence === undefined ? { kind: 'snapshot', state: this.state }
      : { kind: 'playback', roomId: this.state.id, hostId: this.state.hostId, term: this.state.term,
        previousSequence, sequence: this.state.sequence, presentation: this.state.presentation ?? null };
    for (const channel of this.channels.values()) {
      if (channel.authenticated) void this.sendFrame(channel, message.kind === 'playback' && !channel.playbackDeltas ? { kind: 'snapshot', state: this.state } : message);
    }
    for (const channel of this.aliasChannels.values()) {
      const direct = this.channels.get(channel.connection.peer);
      if (channel.authenticated && (!direct?.authenticated || !direct.connection.open)) {
        void this.sendFrame(channel, message.kind === 'playback' && !channel.playbackDeltas ? { kind: 'snapshot', state: this.state } : message);
      }
    }
    this.connectMembers();
  }

  private discover(): void {
    if (this.closed || !this.peer.open || this.authority || this.anchor?.connection.open) return;
    if (Date.now() - this.lastDiscovery < 2000) return;
    this.lastDiscovery = Date.now();
    this.anchor?.connection.close();
    this.attach(this.peer.connect(this.roomAddress, { reliable: true }), this.session.identity, true);
  }

  private acquire(): void {
    if (this.closed || this.acquiring || !this.peer.open || !this.state) return;
    this.acquiring = true;
    const alias = new Peer(this.roomAddress, this.options);
    this.alias = alias;
    alias.on('open', () => {
      this.acquiring = false;
      if (this.closed || this.alias !== alias || !this.state) { alias.destroy(); return; }
      if (this.state.hostId !== this.session.identity) {
        const reachable = this.reachable();
        if (eldestSuccessor(this.state, reachable)?.id !== this.session.identity) { this.release(); return; }
        this.state = promoteSuccessor(this.state, this.session.identity, reachable);
      }
      this.anchor?.connection.close(); this.anchor = null;
      this.publish();
    });
    alias.on('connection', (connection) => this.attach(connection, this.roomAddress, false));
    alias.on('disconnected', () => { if (this.alias === alias) { this.release(); this.observer.onStatus('Host ownership lost; reconnecting…'); } });
    alias.on('error', () => { if (this.alias === alias) { this.release(); this.discover(); } });
  }

  private release(): void {
    const alias = this.alias;
    this.alias = null; this.acquiring = false;
    alias?.destroy();
    this.aliasChannels.clear();
  }

  private reachable(): Set<string> {
    const online = new Set([this.session.identity]);
    for (const [id, channel] of this.channels) {
      if (channel.authenticated && channel.connection.open && Date.now() - (this.lastSeen.get(id) ?? 0) < TIMEOUT) online.add(id);
    }
    return online;
  }

  private tick(): void {
    if (this.closed) return;
    if (this.peer.disconnected && !this.peer.destroyed) { this.peer.reconnect(); return; }
    if (!this.peer.open) return;
    this.broadcast({ kind: 'ping', term: this.state?.term ?? 0, authority: this.authority });
    this.connectMembers();
    if (!this.state) {
      if (Date.now() - this.startedAt > TIMEOUT) this.observer.onStatus('Room unavailable. Check the full invite and keep a member online.');
      this.discover(); return;
    }
    if (this.authority) {
      for (const member of this.state.members) {
        if (member.id !== this.session.identity && Date.now() - (this.lastSeen.get(member.id) ?? Date.now()) > TIMEOUT) this.removeMember(member.id);
      }
      return;
    }
    if (Date.now() - this.lastAuthoritySeen > TIMEOUT) {
      this.observer.onStatus('Polling for the next host…');
      // A dead browser's RTC channel can still report open until ICE times out.
      this.anchor?.connection.close(); this.anchor = null;
      this.discover();
      if (eldestSuccessor(this.state, this.reachable())?.id === this.session.identity) this.acquire();
    } else this.discover();
  }

  private removeMember(id: string): void {
    if (!this.state || id === this.state.hostId || !this.state.members.some((member) => member.id === id)) return;
    const { presentation, ...rest } = this.state;
    this.state = { ...rest, ...(presentation && presentation.ownerId !== id ? { presentation } : {}),
      sequence: rest.sequence + 1, members: rest.members.filter((member) => member.id !== id) };
    this.media.remove(id); this.screen.remove(id); this.driveLimits.delete(id); this.publish();
  }

  private commitPresentation(next: Presentation | null, sender: string): void {
    if (!this.authority || !this.state || !this.state.members.some((member) => member.id === sender)) throw new Error('Wait for a room host.');
    if (!canUpdatePresentation(this.state.presentation, next, sender)) throw new Error('Stop the current presentation before sharing another tab.');
    if (JSON.stringify(this.state.presentation ?? null) === JSON.stringify(next)) return;
    const { presentation: previous, ...rest } = this.state;
    void previous;
    this.state = { ...rest, ...(next ? { presentation: next } : {}), sequence: rest.sequence + 1 };
    this.publish(rest.sequence);
  }

  public async updatePresentation(presentation: Presentation | null): Promise<void> {
    if (this.authority) { this.commitPresentation(presentation, this.session.identity); return; }
    const host = this.state && this.channels.get(this.state.hostId);
    if (!host?.authenticated || !host.connection.open) throw new Error('Wait for the host connection.');
    if (this.pending.size >= 12) throw new Error('Please wait for pending room requests.');
    const id = crypto.randomUUID();
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('Sharing was not confirmed.')); }, TIMEOUT);
      this.pending.set(id, { resolve, reject, timer });
      void this.sendFrame(host, { kind: 'presentation', id, presentation });
    });
  }

  public setScreen(stream: MediaStream | null): void { this.screen.setStream(stream); this.screen.sync(this.channels.keys()); }

  public async controlDrive(command: DriveAction): Promise<PlaybackState> {
    const parsed = driveActionSchema.parse(command);
    const share = this.state?.presentation;
    if (!share) throw new Error('No Drive tab is shared.');
    if (share.ownerId === this.session.identity) return this.observer.onDriveControl(parsed);
    const channel = this.channels.get(share.ownerId);
    if (!channel?.authenticated || !channel.connection.open) throw new Error('The presenter is disconnected.');
    if (this.drivePending.size >= 12) throw new Error('Please wait for pending playback requests.');
    const id = crypto.randomUUID();
    return new Promise<PlaybackState>((resolve, reject) => {
      const timer = setTimeout(() => { this.drivePending.delete(id); reject(new Error('The presenter did not acknowledge playback.')); }, 10000);
      this.drivePending.set(id, { owner: share.ownerId, epoch: share.epoch, resolve, reject, timer });
      void this.sendFrame(channel, { kind: 'drive-control', id, epoch: share.epoch, command: parsed });
    });
  }

  private commitChat(message: ChatWireMessage): void {
    if (!this.state || !this.authority) throw new Error('Wait for a room host.');
    if (this.seenChat.has(message.id)) return;
    if (this.seenChat.size >= 10000) throw new Error('Create a new room to continue chatting.');
    this.seenChat.add(message.id);
    this.state = { ...this.state, sequence: this.state.sequence + 1, messages: [...this.state.messages, message].slice(-100) };
    this.publish();
  }

  public async sendChat(message: ChatWireMessage): Promise<void> {
    if (this.authority) { this.commitChat(message); return; }
    const host = this.state && this.channels.get(this.state.hostId);
    if (!host?.authenticated || !host.connection.open) throw new Error('Wait for the host connection.');
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(message.id); reject(new Error('Message not confirmed.')); }, TIMEOUT);
      this.pending.set(message.id, { resolve, reject, timer });
      void this.sendFrame(host, { kind: 'chat', message });
    });
  }

  public react(emoji: string): void {
    const parsed = messageSchema.parse({ kind: 'reaction', emoji });
    if (!this.state?.reactions) return;
    if (this.authority) { this.observer.onReaction(emoji); this.broadcast(parsed); }
    else {
      const host = this.channels.get(this.state.hostId);
      if (host?.authenticated) { this.observer.onReaction(emoji); void this.sendFrame(host, parsed); }
    }
  }

  public setStream(stream: MediaStream | null): void {
    this.media.setStream(stream);
    this.broadcast({ kind: 'media', enabled: Boolean(stream) });
  }

  public close(): void {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.interval);
    for (const request of this.pending.values()) { clearTimeout(request.timer); request.reject(new Error('Room left.')); }
    this.pending.clear(); this.release(); this.peer.destroy();
    for (const request of this.drivePending.values()) { clearTimeout(request.timer); request.reject(new Error('Room left.')); }
    this.drivePending.clear(); this.driveLimits.clear(); this.screen.close();
    this.media.close(); this.channels.clear(); this.seenChat.clear();
  }
}
