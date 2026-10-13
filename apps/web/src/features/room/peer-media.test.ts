import { EventEmitter } from 'node:events';
import { jest } from '@jest/globals';
import type { MediaConnection } from 'peerjs';
import { PeerMedia } from './services/peer-media';

class TestCall extends EventEmitter {
  public readonly peer = 'member';
  public answer = jest.fn();
  public close = jest.fn(() => this.emit('close'));
  public connection(): MediaConnection { return this as unknown as MediaConnection; }
}
const local = { id: 'local-stream' } as MediaStream;
const firstStream = { id: 'first-stream' } as MediaStream;
const secondStream = { id: 'replacement-stream' } as MediaStream;

describe('PeerJS media lifecycle', () => {
  it('rejects media before joining and from unauthenticated members', () => {
    const peer = { call: jest.fn(() => new TestCall().connection()) };
    const media = new PeerMedia(peer, () => false, jest.fn());
    const call = new TestCall();
    media.receive(call.connection());
    expect(call.close).toHaveBeenCalled();
    media.setStream(local); media.setRemote('member', true);
    expect(peer.call).not.toHaveBeenCalled();
  });
  it('renders one inbound stream and ignores stale close/stream callbacks', () => {
    const changed = jest.fn();
    const media = new PeerMedia({ call: jest.fn(() => new TestCall().connection()) }, () => true, changed);
    media.setStream(local); media.setRemote('member', true);
    const first = new TestCall();
    media.receive(first.connection()); first.emit('stream', firstStream);
    const replacement = new TestCall();
    media.receive(replacement.connection()); replacement.emit('stream', secondStream);
    first.emit('close'); first.emit('stream', firstStream);
    expect(changed.mock.lastCall?.[0]).toEqual(new Map([['member', secondStream]]));
    expect(first.close).toHaveBeenCalled();
    expect(replacement.answer).toHaveBeenCalledTimes(1);
  });
  it('replaces outgoing calls on track changes and closes all media on leave', () => {
    const outgoing: TestCall[] = [];
    const peer = { call: jest.fn(() => { const call = new TestCall(); outgoing.push(call); return call.connection(); }) };
    const changed = jest.fn();
    const media = new PeerMedia(peer, () => true, changed);
    media.setStream(local); media.setRemote('member', true);
    media.setStream(firstStream);
    expect(peer.call).toHaveBeenCalledTimes(2);
    expect(outgoing[0].close).toHaveBeenCalled();
    media.close();
    expect(outgoing[1].close).toHaveBeenCalled();
    expect(changed.mock.lastCall?.[0]).toEqual(new Map());
    expect(media.enabled).toBe(false);
  });
});
