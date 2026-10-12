import {
  addMember,
  applyPlaybackCommand,
  createRoomState,
  removeMember,
  serializeRoomState,
} from '../src/rooms/room-state.js';
import { createRoomTicket, verifyRoomTicket } from '../src/auth/room-ticket.js';

describe('room state', () => {
  it('keeps a single member record for a reconnecting identity', () => {
    const room = createRoomState('movie-night', 100);
    const connected = addMember(room, { displayName: 'Raman', id: 'raman' });
    const reconnected = addMember(connected, { displayName: 'Raman S.', id: 'raman' });

    expect(serializeRoomState(reconnected).members).toEqual([{ displayName: 'Raman S.', id: 'raman' }]);
  });

  it('removes departed members without changing the remaining playback state', () => {
    const room = addMember(createRoomState('movie-night', 100), { displayName: 'Raman', id: 'raman' });
    const started = applyPlaybackCommand(room, { type: 'play' }, 200);
    const departed = removeMember(started, 'raman');

    expect(departed.members.size).toBe(0);
    expect(departed.playback).toEqual({ isPlaying: true, positionSeconds: 0, updatedAt: 200 });
  });

  it('accepts playback control from room members and clamps invalid negative seeks', () => {
    const room = createRoomState('movie-night', 100);
    const sought = applyPlaybackCommand(room, { positionSeconds: -5, type: 'seek' }, 200);

    expect(sought.playback.positionSeconds).toBe(0);
    expect(sought.playback.updatedAt).toBe(200);
  });

  it('accepts only a matching, unexpired signed room ticket', () => {
    const secret = 'a-very-long-test-secret-that-is-not-production';
    const ticket = createRoomTicket(
      { displayName: 'Raman', expiresAt: 200, identity: 'd8e65d72-c5d0-46f0-9236-331e01ddf8b4', roomId: 'movie-night' },
      secret,
    );

    expect(verifyRoomTicket(ticket, secret, 199)?.roomId).toBe('movie-night');
    expect(verifyRoomTicket(ticket, secret, 200)).toBeUndefined();
    expect(verifyRoomTicket(`${ticket}x`, secret, 199)).toBeUndefined();
  });
});
