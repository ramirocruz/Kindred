import type Peer from 'peerjs';
import type { MediaConnection } from 'peerjs';
import type { Presentation } from './gdrive-protocol';

/** Captured movie tracks are separate from camera/microphone calls and processing. */
export class PeerScreen {
  private local: MediaStream | null = null;
  private presentation: Presentation | undefined;
  private outgoing = new Map<string, MediaConnection>();
  private incoming: MediaConnection | null = null;

  constructor(private readonly peer: Pick<Peer, 'call'>, private readonly identity: string,
    private readonly authenticated: (id: string) => boolean,
    private readonly changed: (stream: MediaStream | null) => void) {}

  public setPresentation(presentation: Presentation | undefined): void {
    const changed = this.presentation?.epoch !== presentation?.epoch || this.presentation?.ownerId !== presentation?.ownerId;
    this.presentation = presentation;
    if (changed) this.clearCalls();
    if (this.local && presentation?.ownerId === this.identity) this.changed(this.local);
  }

  public setStream(stream: MediaStream | null): void {
    this.clearCalls(); this.local = stream;
    this.changed(stream);
  }

  public sync(ids: Iterable<string>): void {
    if (!this.local || this.presentation?.ownerId !== this.identity) return;
    for (const id of ids) {
      if (!this.authenticated(id) || this.outgoing.has(id)) continue;
      const call = this.peer.call(id, this.local, { metadata: { kind: 'gdrive', epoch: this.presentation.epoch } });
      this.outgoing.set(id, call);
      call.on('close', () => { if (this.outgoing.get(id) === call) this.outgoing.delete(id); });
      call.on('error', () => call.close());
    }
  }

  public receive(call: MediaConnection): void {
    const metadata: unknown = call.metadata;
    const epoch = metadata && typeof metadata === 'object' && 'epoch' in metadata ? metadata.epoch : null;
    if (!this.authenticated(call.peer) || call.peer !== this.presentation?.ownerId || epoch !== this.presentation.epoch) {
      call.close(); return;
    }
    this.incoming?.close(); this.incoming = call;
    call.on('stream', (stream) => { if (this.incoming === call) this.changed(stream); });
    call.on('close', () => { if (this.incoming === call) { this.incoming = null; this.changed(null); } });
    call.on('error', () => call.close());
    call.answer();
  }

  public remove(id: string): void {
    const outgoing = this.outgoing.get(id); this.outgoing.delete(id); outgoing?.close();
    if (this.incoming?.peer === id) { const incoming = this.incoming; this.incoming = null; incoming.close(); this.changed(null); }
  }

  private clearCalls(): void {
    for (const call of this.outgoing.values()) call.close();
    this.outgoing.clear(); const incoming = this.incoming; this.incoming = null; incoming?.close(); this.changed(null);
  }

  public close(): void { this.clearCalls(); this.local = null; this.presentation = undefined; }
}
