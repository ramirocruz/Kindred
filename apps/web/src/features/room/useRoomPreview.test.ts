import { roomPreviewReducer } from './useRoomPreview.js';
import type { RoomSnapshot } from './types.js';

const initialRoom: RoomSnapshot = {
  id: 'room-1',
  members: [
    { displayName: 'You', id: 'self', isCameraOn: true, isMicrophoneOn: true, role: 'creator' },
    { displayName: 'Maya', id: 'maya', isCameraOn: true, isMicrophoneOn: true, role: 'member' },
  ],
  name: 'Friday Night Picks',
  playback: { isPlaying: false, positionSeconds: 0 },
};

describe('room preview reducer', () => {
  it('keeps all members in sync with the shared playback state', () => {
    const playing = roomPreviewReducer(initialRoom, { type: 'playback/toggle' });
    const sought = roomPreviewReducer(playing, { positionSeconds: 120, type: 'playback/seek' });

    expect(sought.playback).toEqual({ isPlaying: true, positionSeconds: 120 });
  });

  it('changes only the local camera state', () => {
    const nextRoom = roomPreviewReducer(initialRoom, { type: 'self/toggle-camera' });

    expect(nextRoom.members.find((member) => member.id === 'self')?.isCameraOn).toBe(false);
    expect(nextRoom.members.find((member) => member.id === 'maya')?.isCameraOn).toBe(true);
  });
});
