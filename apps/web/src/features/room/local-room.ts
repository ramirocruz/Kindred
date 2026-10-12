export interface LocalRoom {
  displayName: string;
  name: string;
  reactions: boolean;
}
export function createLocalRoom(
  displayName: string,
  name: string,
  reactions: boolean,
): LocalRoom {
  if (!name.trim() || !displayName.trim())
    throw new Error("Enter your name and a room name.");
  return {
    displayName: displayName.trim().slice(0, 24),
    name: name.trim().slice(0, 50),
    reactions,
  };
}
export const sources = [
  "YouTube",
  "Web video",
  "Personal file",
  "GDrive",
  "Screen share",
] as const;
export type Source = (typeof sources)[number];
