import { z } from 'zod';
import { driveActionSchema, playbackSchema, type DriveAction, type PlaybackState, type Presentation } from './gdrive-protocol';

const startSchema = z.object({ id: z.string().uuid(), streamId: z.string().min(1), token: z.string().uuid(),
  room: z.string().uuid(), title: z.string().min(1).max(200) });
const resultSchema = z.object({ id: z.string().uuid(), ok: z.boolean(), state: playbackSchema.optional(), message: z.string().max(250).optional() });
const channel = 'kindred-tab-control';
interface BridgeObserver {
  ready: () => boolean;
  share: (presentation: Presentation | null, stream: MediaStream | null) => Promise<void>;
  update: (presentation: Presentation) => Promise<void>;
  error: (message: string) => void;
}

/** Presenter-only extension capability stays in this page; room peers get an epoch. */
export class GDriveBridge {
  private token: string | null = null;
  private stream: MediaStream | null = null;
  private presentation: Presentation | null = null;
  private generation = 0;
  private closed = false;
  private polling = false;
  private starting = false;
  private confirmed = false;
  private pending = new Map<string, { resolve: (state: PlaybackState) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private interval: ReturnType<typeof setInterval>;

  constructor(private readonly roomId: string, private readonly identity: string, private readonly observer: BridgeObserver) {
    window.addEventListener('message', this.receive);
    this.interval = setInterval(() => {
      if (!this.token || this.polling || this.pending.size) return;
      this.polling = true;
      void this.control({ action: 'state' }).catch((error: unknown) => {
        const message = error instanceof Error ? error.message.slice(0, 250) : 'Drive playback unavailable.';
        this.observer.error(message);
        if (this.presentation) {
          this.presentation = { ...this.presentation, error: message };
          void this.observer.update(this.presentation).catch(() => {});
        }
      }).finally(() => { this.polling = false; });
    }, 1500);
  }

  private post(type: string, payload: unknown): void { window.postMessage({ channel, type, payload }, location.origin); }

  private receive = (event: MessageEvent<unknown>): void => {
    if (event.source !== window || event.origin !== location.origin || !event.data || typeof event.data !== 'object') return;
    const message = z.object({ channel: z.literal(channel), type: z.string(), payload: z.unknown() }).safeParse(event.data);
    if (!message.success) return;
    const { type, payload } = message.data;
    if (type === 'quiet-prepare') {
      const parsed = z.object({ id: z.string().uuid() }).safeParse(payload);
      if (parsed.success) this.post('quiet-response', { id: parsed.data.id, ok: this.observer.ready() && !this.stream && !this.starting,
        room: this.roomId, message: 'Create or join a connected room; stop any current presentation first.' });
    }
    if (type === 'quiet-start') {
      const parsed = startSchema.safeParse(payload);
      if (parsed.success) void this.start(parsed.data);
    }
    if (type === 'quiet-result') {
      const parsed = resultSchema.safeParse(payload);
      if (!parsed.success) return;
      const request = this.pending.get(parsed.data.id);
      if (!request) return;
      this.pending.delete(parsed.data.id); clearTimeout(request.timer);
      if (parsed.data.ok && parsed.data.state) request.resolve(parsed.data.state);
      else request.reject(new Error(parsed.data.message || 'Playback failed.'));
    }
    if (type === 'quiet-stop' && this.token) {
      const parsed = z.object({ token: z.string().uuid() }).safeParse(payload);
      if (parsed.success && parsed.data.token === this.token) void this.stop();
    }
  };

  private async start(payload: z.infer<typeof startSchema>): Promise<void> {
    let stream: MediaStream | null = null;
    let ownsStart = false;
    const generation = this.generation;
    try {
      if (this.closed || payload.room !== this.roomId || !this.observer.ready() || this.stream || this.starting) throw new Error('The room changed or is not ready.');
      this.starting = true; ownsStart = true;
      const constraint = { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: payload.streamId } };
      // Chrome's extension-issued tab constraints are not standard DOM typings.
      stream = await navigator.mediaDevices.getUserMedia({ video: constraint as MediaTrackConstraints, audio: constraint as MediaTrackConstraints });
      const movie = stream.getVideoTracks()[0];
      if (movie) {
        movie.contentHint = 'motion';
        // Bound movie capture cost; leave audio and browser codec/congestion control untouched.
        try { await movie.applyConstraints({ width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 }, frameRate: { ideal: 30, max: 30 } }); }
        catch { console.warn('Kindred media', { event: 'gdrive.capture_profile_unsupported' }); }
      }
      if (this.closed || generation !== this.generation) throw new Error('Sharing was cancelled.');
      this.token = payload.token; this.stream = stream;
      this.presentation = { ownerId: this.identity, epoch: crypto.randomUUID(), title: payload.title, playback: null, error: '' };
      await this.observer.share(this.presentation, stream);
      if (this.closed || generation !== this.generation) throw new Error('Sharing was cancelled.');
      this.confirmed = true;
      stream.getVideoTracks()[0]?.addEventListener('ended', () => { if (this.stream === stream) void this.stop(); }, { once: true });
      this.post('quiet-response', { id: payload.id, ok: true });
      void this.control({ action: 'state' }).catch((error: unknown) => this.observer.error(error instanceof Error ? error.message : 'Playback unavailable.'));
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      if (stream && this.stream === stream) await this.stop();
      this.post('quiet-response', { id: payload.id, ok: false, message: error instanceof Error ? error.message : 'Tab capture failed.' });
    } finally { if (ownsStart) this.starting = false; }
  }

  public reconcile(current: Presentation | undefined): void {
    if (this.confirmed && this.presentation && (current?.epoch !== this.presentation.epoch || current.ownerId !== this.identity)) void this.stop();
  }

  public async control(command: DriveAction): Promise<PlaybackState> {
    driveActionSchema.parse(command);
    if (!this.token || !this.presentation || this.closed) throw new Error('Share your Drive tab using the extension first.');
    if (this.pending.size >= 12) throw new Error('Please wait for pending playback requests.');
    const generation = this.generation;
    const id = crypto.randomUUID();
    const playback = await new Promise<PlaybackState>((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('The Drive tab did not acknowledge playback.')); }, 8000);
      this.pending.set(id, { resolve, reject, timer });
      this.post('quiet-command', { id, ...command, token: this.token, room: this.roomId });
    });
    if (generation !== this.generation || !this.presentation) throw new Error('The shared tab changed.');
    this.presentation = { ...this.presentation, playback, error: '' };
    await this.observer.update(this.presentation);
    return playback;
  }

  public async stop(): Promise<void> {
    const token = this.token;
    this.generation++; this.token = null; this.presentation = null; this.confirmed = false;
    const stream = this.stream; this.stream = null;
    stream?.getTracks().forEach((track) => track.stop());
    for (const request of this.pending.values()) { clearTimeout(request.timer); request.reject(new Error('Sharing stopped.')); }
    this.pending.clear();
    if (token) this.post('quiet-command', { id: crypto.randomUUID(), action: 'stop', token, room: this.roomId });
    if (stream) await this.observer.share(null, null).catch(() => this.observer.error('Sharing stopped locally. Room state will clear when the presenter disconnects.'));
  }

  public close(): void {
    this.closed = true; clearInterval(this.interval); window.removeEventListener('message', this.receive); void this.stop();
  }
}
