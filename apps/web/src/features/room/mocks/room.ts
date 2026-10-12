import { faker } from '@faker-js/faker/locale/en';

import type { RoomMember, RoomSnapshot } from '../types';

function createMember(role: RoomMember['role']): RoomMember {
  return {
    id: faker.string.uuid(),
    displayName: role === 'creator' ? 'You' : faker.person.firstName(),
    role,
    isCameraOn: true,
    isMicrophoneOn: role === 'creator',
  };
}

export function createMockRoomSnapshot(): RoomSnapshot {
  return {
    id: faker.string.uuid(),
    name: 'Friday Night Picks',
    members: [createMember('creator'), createMember('member'), createMember('member')],
    playback: {
      isPlaying: false,
      positionSeconds: 0,
    },
  };
}
