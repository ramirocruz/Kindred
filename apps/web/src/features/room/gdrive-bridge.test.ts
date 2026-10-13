import { jest } from '@jest/globals';
import { GDriveBridge } from './services/gdrive-bridge';
import type { Presentation } from './services/gdrive-protocol';

const room = crypto.randomUUID(), identity = crypto.randomUUID();
const origin = 'http://127.0.0.1:5173';
const originals = new Map(['window', 'location', 'navigator'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
let receive: ((event: MessageEvent<unknown>) => void) | undefined;
const post = jest.fn<(message: { type: string; payload: Record<string, unknown> }, origin: string) => void>();
const windowStub = { addEventListener: (_: string, handler: typeof receive) => { receive = handler; }, removeEventListener: jest.fn(), postMessage: post };
const flush = async (): Promise<void> => { for (let index = 0; index < 5; index++) await new Promise<void>((resolve) => setImmediate(resolve)); };
function emit(type: string, payload: unknown, source: unknown = windowStub): void {
  receive?.({ origin, source, data: { channel: 'kindred-tab-control', type, payload } } as MessageEvent<unknown>);
}

describe('presenter extension bridge', () => {
  let bridge: GDriveBridge;
  const stop = jest.fn();
  const stream = { getTracks: () => [{ stop }], getVideoTracks: () => [{ addEventListener: jest.fn() }] } as unknown as MediaStream;
  const share = jest.fn<(next: Presentation | null, stream: MediaStream | null) => Promise<void>>(async () => {});
  const update = jest.fn<(next: Presentation) => Promise<void>>(async () => {});
  const capture = jest.fn<() => Promise<MediaStream>>(async () => stream);
  beforeEach(() => {
    post.mockClear(); share.mockClear(); update.mockClear(); stop.mockClear(); capture.mockClear();
    Object.defineProperty(globalThis, 'window', { configurable: true, value: windowStub });
    Object.defineProperty(globalThis, 'location', { configurable: true, value: { origin } });
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: { getUserMedia: capture } } });
    bridge = new GDriveBridge(room, identity, { ready: () => true, share, update, error: jest.fn() });
  });
  afterEach(async () => {
    bridge.close(); await flush();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  it('rejects foreign window messages before capture', async () => {
    emit('quiet-start', { id: crypto.randomUUID(), streamId: 'stream', room, token: crypto.randomUUID(), title: 'Movie' }, {});
    await flush(); expect(capture).not.toHaveBeenCalled();
  });
  it('pins the room, keeps the extension token local, and cancels outstanding playback on stop', async () => {
    const token = crypto.randomUUID();
    emit('quiet-start', { id: crypto.randomUUID(), streamId: 'stream', room, token, title: 'Movie' });
    await flush();
    expect(capture).toHaveBeenCalledTimes(1);
    const presentation = share.mock.calls[0][0];
    expect(presentation?.ownerId).toBe(identity);
    expect(JSON.stringify(presentation)).not.toContain(token);
    const initial = post.mock.calls.find(([message]) => message.type === 'quiet-command')?.[0];
    emit('quiet-result', { id: initial?.payload.id, ok: true, state: { time: 30, duration: 100, paused: false } });
    await flush(); expect(update.mock.lastCall?.[0].playback?.time).toBe(30);
    const request = bridge.control({ action: 'pause' });
    const failure = expect(request).rejects.toThrow('Sharing stopped.');
    await bridge.stop(); await failure;
    expect(stop).toHaveBeenCalled(); expect(share.mock.lastCall?.[0]).toBeNull();
  });
  it('does not capture for a stale room invitation', async () => {
    emit('quiet-start', { id: crypto.randomUUID(), streamId: 'stream', room: crypto.randomUUID(), token: crypto.randomUUID(), title: 'Movie' });
    await flush(); expect(capture).not.toHaveBeenCalled();
  });
});
