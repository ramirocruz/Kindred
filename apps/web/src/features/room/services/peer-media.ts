import type Peer from 'peerjs';
import type { MediaConnection } from 'peerjs';

interface CallEntry { call: MediaConnection; stream?: MediaStream }

/** One rendered inbound stream per member; outgoing calls are never rendered. */
export class PeerMedia {
  private local: MediaStream | null = null;
  private calls = new Map<string, CallEntry>();
  private remoteEnabled = new Set<string>();

  constructor(private readonly peer: Pick<Peer, 'call'>,
    private readonly authenticated: (id: string) => boolean,
    private readonly onStreams: (streams: ReadonlyMap<string, MediaStream>) => void) {}

  public get enabled(): boolean { return this.local !== null; }

  public setStream(stream: MediaStream | null): void {
    this.local = stream;
    for (const [key, entry] of this.calls) if (key.startsWith('out:')) { this.calls.delete(key); entry.call.close(); }
    if (stream) for (const id of this.remoteEnabled) this.callMember(id);
    else { for (const entry of this.calls.values()) entry.call.close(); this.calls.clear(); this.emit(); }
  }

  public setRemote(id: string, enabled: boolean): void {
    if (enabled) { this.remoteEnabled.add(id); this.callMember(id); }
    else this.remove(id);
  }

  private callMember(id: string): void {
    if (!this.local || !this.authenticated(id) || this.calls.has(`out:${id}`)) return;
    const call = this.peer.call(id, this.local);
    this.calls.set(`out:${id}`, { call });
    call.on('close', () => { if (this.calls.get(`out:${id}`)?.call === call) this.calls.delete(`out:${id}`); });
    call.on('error', () => call.close());
  }

  public receive(call: MediaConnection): void {
    if (!this.local || !this.authenticated(call.peer) || !this.remoteEnabled.has(call.peer)) { call.close(); return; }
    const key = `in:${call.peer}`;
    this.calls.get(key)?.call.close();
    const entry: CallEntry = { call };
    this.calls.set(key, entry);
    call.on('stream', (stream) => { if (this.calls.get(key) === entry) { entry.stream = stream; this.emit(); } });
    call.on('close', () => { if (this.calls.get(key) === entry) { this.calls.delete(key); this.emit(); } });
    call.on('error', () => call.close());
    call.answer();
  }

  public remove(id: string): void {
    this.remoteEnabled.delete(id);
    for (const key of [`in:${id}`, `out:${id}`]) { const entry = this.calls.get(key); this.calls.delete(key); entry?.call.close(); }
    this.emit();
  }

  public close(): void { this.setStream(null); this.remoteEnabled.clear(); }

  private emit(): void {
    const streams = new Map<string, MediaStream>();
    for (const [key, entry] of this.calls) if (key.startsWith('in:') && entry.stream) streams.set(key.slice(3), entry.stream);
    this.onStreams(streams);
  }
}
