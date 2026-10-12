import { useReducer } from 'react';

import type { RoomPreviewAction, RoomSnapshot } from './types';

export function roomPreviewReducer(state: RoomSnapshot, action: RoomPreviewAction): RoomSnapshot {
  if (action.type === 'playback/toggle') {
    return { ...state, playback: { ...state.playback, isPlaying: !state.playback.isPlaying } };
  }

  if (action.type === 'playback/seek') {
    return { ...state, playback: { ...state.playback, positionSeconds: action.positionSeconds } };
  }

  const property = action.type === 'self/toggle-camera' ? 'isCameraOn' : 'isMicrophoneOn';
  return {
    ...state,
    members: state.members.map((member) =>
      member.role === 'creator' ? { ...member, [property]: !member[property] } : member,
    ),
  };
}

export function useRoomPreview(
  initialState: RoomSnapshot,
): readonly [RoomSnapshot, React.Dispatch<RoomPreviewAction>] {
  return useReducer(roomPreviewReducer, initialState);
}
