import { useState } from "react";
import { Landing } from "./features/room/components/Landing";
import { WatchRoom } from "./features/room/components/WatchRoom";
import type { LocalRoom } from "./features/room/local-room";

export function App(): React.JSX.Element {
  const [room, setRoom] = useState<LocalRoom | null>(null);
  return room ? (
    <WatchRoom room={room} onLeave={() => setRoom(null)} />
  ) : (
    <Landing onCreate={setRoom} />
  );
}
