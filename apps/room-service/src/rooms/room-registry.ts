import {
  addMember,
  applyPlaybackCommand,
  createRoomState,
  removeMember,
  type PlaybackCommand,
  type RoomMember,
  type RoomState,
} from './room-state.js';

export class RoomRegistry {
  private readonly rooms = new Map<string, RoomState>();

  public get(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  public join(roomId: string, member: RoomMember, now: number): RoomState {
    const room = this.rooms.get(roomId) ?? createRoomState(roomId, now);
    const nextRoom = addMember(room, member);
    this.rooms.set(roomId, nextRoom);
    return nextRoom;
  }

  public leave(roomId: string, memberId: string): RoomState | undefined {
    const room = this.rooms.get(roomId);
    if (!room) {
      return undefined;
    }

    const nextRoom = removeMember(room, memberId);
    if (nextRoom.members.size === 0) {
      this.rooms.delete(roomId);
      return undefined;
    }

    this.rooms.set(roomId, nextRoom);
    return nextRoom;
  }

  public applyPlayback(roomId: string, command: PlaybackCommand, now: number): RoomState | undefined {
    const room = this.rooms.get(roomId);
    if (!room) {
      return undefined;
    }

    const nextRoom = applyPlaybackCommand(room, command, now);
    this.rooms.set(roomId, nextRoom);
    return nextRoom;
  }
}
