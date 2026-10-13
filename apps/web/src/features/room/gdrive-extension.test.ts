import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { jest } from '@jest/globals';

const extension = new URL('../../../../../extensions/gdrive/', import.meta.url);
const mediaSource = readFileSync(new URL('media.js', extension), 'utf8');
interface MediaResult { time?: number; paused?: boolean; failure?: string }
type Operation = (command: { action: string; time?: number }, id?: string) => Promise<MediaResult>;
function fixture(): { video: { currentTime: number; paused: boolean; pause: ReturnType<typeof jest.fn> }; operation: Operation } {
  const video = { currentTime: 27, duration: 100, isConnected: true, seeking: false, paused: false,
    seekable: { length: 1, start: () => 0, end: () => 100 },
    pause: jest.fn(() => { video.paused = true; }), play: jest.fn(async () => { video.paused = false; }),
    addEventListener: jest.fn(), removeEventListener: jest.fn() };
  const operation = runInNewContext(`${mediaSource.replace('export ', '')}; mediaOperation`, {
    __kindredQuietMedia: new Map([['video', video]]), setTimeout, clearTimeout,
  }) as Operation;
  return { video, operation };
}

describe('legacy-derived extension media operations', () => {
  it('labels rooms by custom name and stable short room code, never tab IDs or keys', () => {
    const source = readFileSync(new URL('room-url.js', extension), 'utf8').replaceAll('export ', '');
    const label = runInNewContext(`${source}; roomLabel`, { URL, URLSearchParams }) as (tab: { url: string; title?: string; id?: number }) => string | null;
    const id = '12345678-1234-4234-8234-123456789abc';
    const url = `http://localhost:5173/#invite=${id}&chatKey=secret`;
    expect(label({ url, title: 'Friday Night Picks · Kindred', id: 211476648 })).toBe('Friday Night Picks · Room 12345678');
    expect(label({ url, title: 'Kindred — Watch together' })).toBe('Kindred room · Room 12345678');
    expect(label({ url })).toBe('Kindred room · Room 12345678');
    expect(label({ url: 'https://evil.example/' })).toBeNull();
    expect(label({ url, title: '<Movie night> · Kindred' })).toBe('<Movie night> · Room 12345678');
  });
  it('pauses without resetting the source timeline', async () => {
    const { video, operation } = fixture();
    const result = await operation({ action: 'pause' }, 'video');
    expect(result.paused).toBe(true); expect(video.currentTime).toBe(27);
  });
  it('seeks the actual media and rejects invalid targets without zero fallback', async () => {
    const { video, operation } = fixture();
    expect((await operation({ action: 'seek', time: 55 }, 'video')).time).toBe(55);
    expect((await operation({ action: 'seek', time: NaN }, 'video')).failure).toBe('Invalid seek time.');
    expect(video.currentTime).toBe(55);
    expect((await operation({ action: 'seek', time: 500 }, 'video')).time).toBeCloseTo(99.95);
  });
  it('supports new invite hashes without exposing their secret in the popup', () => {
    const source = readFileSync(new URL('room-url.js', extension), 'utf8').replaceAll('export ', '');
    const roomId = runInNewContext(`${source}; roomId`, { URL, URLSearchParams }) as (url: string) => string | null;
    const id = crypto.randomUUID();
    expect(roomId(`http://127.0.0.1:5173/#invite=${id}&chatKey=secret`)).toBe(id);
    expect(roomId(`http://localhost:5173/#invite=${id}`)).toBe(id);
    expect(roomId(`https://evil.example/#invite=${id}`)).toBeNull();
    expect(roomId(`https://ramirocruz.github.io/Kindred/#invite=${id}`)).toBe(id);
    expect(roomId(`https://ramirocruz.github.io/other/#invite=${id}`)).toBeNull();
    expect(roomId(`http://localhost:5173/#invite=${id}&invite=${id}`)).toBeNull();
    const popup = readFileSync(new URL('popup.js', extension), 'utf8');
    expect(popup).not.toContain('.hash');
    const manifest = JSON.parse(readFileSync(new URL('manifest.json', extension), 'utf8')) as { permissions: string[] };
    expect(manifest.permissions).not.toContain('debugger');
  });
});
