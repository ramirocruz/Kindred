export type PlaybackCommand =
  | { type: 'play' }
  | { type: 'pause' }
  | { positionSeconds: number; type: 'seek' };

export interface RoomMember {
  displayName: string;
  id: string;
}

export interface RoomPlayback {
  isPlaying: boolean;
  positionSeconds: number;
  updatedAt: number;
}

export interface RoomState {
  id: string;
  members: Map<string, RoomMember>;
  playback: RoomPlayback;
}

export function createRoomState(id: string, now: number): RoomState {
  return {
    id,
    members: new Map(),
    playback: { isPlaying: false, positionSeconds: 0, updatedAt: now },
  };
}

export function addMember(state: RoomState, member: RoomMember): RoomState {
  const members = new Map(state.members);
  members.set(member.id, member);
  return { ...state, members };
}

export function removeMember(state: RoomState, memberId: string): RoomState {
  if (!state.members.has(memberId)) {
    return state;
  }

  const members = new Map(state.members);
  members.delete(memberId);
  return { ...state, members };
}

export function applyPlaybackCommand(
  state: RoomState,
  command: PlaybackCommand,
  now: number,
): RoomState {
  const playback = { ...state.playback, updatedAt: now };

  if (command.type === 'play') {
    playback.isPlaying = true;
  } else if (command.type === 'pause') {
    playback.isPlaying = false;
  } else {
    playback.positionSeconds = Math.max(0, command.positionSeconds);
  }

  return { ...state, playback };
}

export function serializeRoomState(state: RoomState): {
  id: string;
  members: RoomMember[];
  playback: RoomPlayback;
} {
  return { id: state.id, members: [...state.members.values()], playback: state.playback };
}
