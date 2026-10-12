import { Invitations } from '../src/rooms/invitations.js';
import { verifyRoomTicket } from '../src/auth/room-ticket.js';

const secret = 'test-only-secret-at-least-32-characters';
describe('private invitations', () => {
  it('issues distinct identities for members of the same invitation', () => {
    const store = new Invitations(secret);
    const invite = store.create('Movie night', true, 1000);
    const first = store.join(invite, 'Host', 1001)!;
    const second = store.join(invite, 'Guest', 1001)!;
    expect(first.id).toBe(second.id);
    expect(first.identity).not.toBe(second.identity);
    expect(verifyRoomTicket(second.ticket, secret, 1002)?.displayName).toBe('Guest');
    expect(verifyRoomTicket(second.ticket, 'wrong-secret', 1002)).toBeUndefined();
  });
  it('rejects guessed and expired invitation capabilities', () => {
    const store = new Invitations(secret);
    const invite = store.create('Movie night', false, 1000);
    expect(store.join('unknown', 'Guest', 1001)).toBeNull();
    expect(store.join(invite, 'Guest', 86401000)).toBeNull();
  });
  it('isolates rooms and bounds invitation storage', () => {
    const store = new Invitations(secret);
    const first = store.create('First', true, 1000);
    const second = store.create('Second', true, 1000);
    expect(store.join(first, 'Host', 1001)?.id).not.toBe(store.join(second, 'Host', 1001)?.id);
    for (let index = 2; index < 1000; index++) store.create('Room', true, 1000);
    expect(() => store.create('Full', true, 1001)).toThrow('capacity');
    expect(() => store.create('Expired cleared', true, 86401000)).not.toThrow();
  });
});
