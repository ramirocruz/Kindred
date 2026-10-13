import { canUpdatePresentation, driveActionSchema, presentationSchema } from './services/gdrive-protocol';
import { promoteSuccessor } from './services/browser-room-state';

const owner = '11111111-1111-4111-8111-111111111111';
const guest = '22222222-2222-4222-8222-222222222222';
const share = presentationSchema.parse({ ownerId: owner, epoch: crypto.randomUUID(), title: 'Movie', playback: null, error: '' });

describe('GDrive sharing protocol', () => {
  it('allows every member to present only after the previous presenter releases', () => {
    expect(canUpdatePresentation(undefined, { ...share, ownerId: guest }, guest)).toBe(true);
    expect(canUpdatePresentation(share, null, guest)).toBe(false);
    expect(canUpdatePresentation(share, { ...share, ownerId: guest }, guest)).toBe(false);
    expect(canUpdatePresentation(share, { ...share, epoch: crypto.randomUUID() }, owner)).toBe(false);
    expect(canUpdatePresentation(share, null, owner)).toBe(true);
  });
  it('rejects invalid seeking without substituting zero', () => {
    for (const time of [-1, NaN, Infinity]) expect(driveActionSchema.safeParse({ action: 'seek', time }).success).toBe(false);
    expect(driveActionSchema.safeParse({ action: 'seek' }).success).toBe(false);
    expect(driveActionSchema.parse({ action: 'seek', time: 40 }).time).toBe(40);
    expect(driveActionSchema.parse({ action: 'pause' }).time).toBeUndefined();
  });
  it('cannot carry private extension tokens in replicated presentation state', () => {
    expect(presentationSchema.safeParse({ ...share, token: crypto.randomUUID() }).success).toBe(false);
  });
  it('clears a departed presenter when authority transfers', () => {
    const state = { id: crypto.randomUUID(), name: 'Room', reactions: true, hostId: owner, term: 1, sequence: 1, nextOrder: 3,
      members: [{ id: owner, displayName: 'Owner', order: 1 }, { id: guest, displayName: 'Guest', order: 2 }], messages: [], presentation: share };
    expect(promoteSuccessor(state, guest, new Set([guest])).presentation).toBeUndefined();
  });
});
