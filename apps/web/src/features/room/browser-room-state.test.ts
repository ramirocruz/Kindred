import { admitMember, browserRoomSchema, eldestSuccessor, isNewerSnapshot, promoteSuccessor, type BrowserRoomState } from './services/browser-room-state';

const host = crypto.randomUUID();
const first = crypto.randomUUID();
const second = crypto.randomUUID();
const initial: BrowserRoomState = { id: crypto.randomUUID(), name: 'Room', reactions: true, hostId: host,
  term: 1, sequence: 0, nextOrder: 2, members: [{ id: host, displayName: 'Host', order: 1 }], messages: [] };

describe('browser authority', () => {
  it('uses committed admission order, not client clocks or lexicographic peer IDs', () => {
    const room = admitMember(admitMember(initial, first, 'First'), second, 'Second');
    expect(eldestSuccessor(room, new Set([first, second]))?.id).toBe(first);
    expect(eldestSuccessor(room, new Set([second]))?.id).toBe(second);
    expect(() => promoteSuccessor(room, second, new Set([first, second]))).toThrow();
  });
  it('promotes the survivor even in a two-person room and rejects stale authority', () => {
    const room = admitMember(initial, first, 'First');
    const promoted = promoteSuccessor(room, first, new Set([first]));
    expect(promoted.hostId).toBe(first);
    expect(promoted.term).toBe(2);
    expect(promoted.members).toHaveLength(1);
    expect(isNewerSnapshot(promoted, room)).toBe(false);
  });
  it('admits returning hosts last without restoring authority', () => {
    const room = admitMember(admitMember(initial, first, 'First'), second, 'Second');
    const promoted = promoteSuccessor(room, first, new Set([first, second]));
    const returned = admitMember(promoted, host, 'Returning');
    expect(returned.hostId).toBe(first);
    expect(returned.members.find((member) => member.id === host)?.order).toBe(4);
    expect(eldestSuccessor(returned, new Set([host, second]))?.id).toBe(second);
  });
  it('rejects duplicate admission positions, unknown hosts and wrong-room snapshots', () => {
    expect(browserRoomSchema.safeParse({ ...initial, hostId: first }).success).toBe(false);
    expect(browserRoomSchema.safeParse({ ...initial, members: [...initial.members, { id: first, displayName: 'First', order: 1 }] }).success).toBe(false);
    expect(isNewerSnapshot(initial, { ...initial, id: crypto.randomUUID(), term: 2 })).toBe(false);
  });
});
