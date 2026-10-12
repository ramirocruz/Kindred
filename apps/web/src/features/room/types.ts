export type MemberRole = 'creator' | 'member';

export interface RoomMember {
  id: string;
  displayName: string;
  role: MemberRole;
  isCameraOn: boolean;
  isMicrophoneOn: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  positionSeconds: number;
}

export interface RoomSnapshot {
  id: string;
  name: string;
  members: RoomMember[];
  playback: PlaybackState;
}

export type RoomPreviewAction =
  | { type: 'playback/toggle' }
  | { type: 'playback/seek'; positionSeconds: number }
  | { type: 'self/toggle-camera' }
  | { type: 'self/toggle-microphone' };
