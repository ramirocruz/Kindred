import { EventEmitter } from 'node:events';
import { jest } from '@jest/globals';
import type { MediaConnection } from 'peerjs';
import { PeerScreen } from './services/peer-screen';
import type { Presentation } from './services/gdrive-protocol';

const share: Presentation = { ownerId: 'presenter', epoch: crypto.randomUUID(), title: 'Drive', playback: null, error: '' };
class TestCall extends EventEmitter {
  public peer = 'presenter';
  public metadata = { kind: 'gdrive', epoch: share.epoch };
  public answer = jest.fn();
  public close = jest.fn(() => this.emit('close'));
  public connection(): MediaConnection { return this as unknown as MediaConnection; }
}

describe('captured tab media', () => {
  it('receives without joining a microphone call; rejects wrong owners and epochs', () => {
    const changed = jest.fn();
    const screen = new PeerScreen({ call: jest.fn(() => new TestCall().connection()) }, 'guest', () => true, changed);
    screen.setPresentation(share);
    const valid = new TestCall(); screen.receive(valid.connection()); valid.emit('stream', { id: 'movie' });
    expect(valid.answer).toHaveBeenCalled();
    expect(changed.mock.lastCall?.[0]).toEqual({ id: 'movie' });
    const stale = new TestCall(); stale.metadata.epoch = 'old'; screen.receive(stale.connection());
    const stranger = new TestCall(); stranger.peer = 'stranger'; screen.receive(stranger.connection());
    expect(stale.close).toHaveBeenCalled(); expect(stranger.close).toHaveBeenCalled();
    screen.close(); expect(valid.close).toHaveBeenCalled(); expect(changed.mock.lastCall?.[0]).toBeNull();
  });
  it('ignores replaced streams and sends only to authenticated members', () => {
    const outgoing = new TestCall(); const call = jest.fn(() => outgoing.connection()); const changed = jest.fn();
    const screen = new PeerScreen({ call }, 'presenter', (id) => id === 'guest', changed);
    screen.setPresentation(share); screen.setStream({ id: 'capture' } as MediaStream);
    screen.sync(['guest', 'stranger']); screen.sync(['guest']);
    expect(call).toHaveBeenCalledTimes(1);
    expect(call.mock.calls[0]).toEqual(['guest', { id: 'capture' }, { metadata: { kind: 'gdrive', epoch: share.epoch } }]);
    screen.remove('guest'); expect(outgoing.close).toHaveBeenCalled();
    screen.close();
  });
  it('does not let a stale inbound close erase its replacement', () => {
    const changed = jest.fn();
    const screen = new PeerScreen({ call: jest.fn(() => new TestCall().connection()) }, 'guest', () => true, changed);
    screen.setPresentation(share);
    const old = new TestCall(), current = new TestCall();
    screen.receive(old.connection()); screen.receive(current.connection()); current.emit('stream', { id: 'current' });
    old.emit('close'); old.emit('stream', { id: 'old' });
    expect(changed.mock.lastCall?.[0]).toEqual({ id: 'current' }); screen.close();
  });
});
