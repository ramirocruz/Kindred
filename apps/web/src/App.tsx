import { useState } from "react";
import { Landing } from "./features/room/components/Landing";
import { WatchRoom } from "./features/room/components/WatchRoom";
import type { LocalRoom } from "./features/room/local-room";
import { openRoom, type RoomSession } from './features/room/services/session';

export function App(): React.JSX.Element {
  const [room, setRoom] = useState<RoomSession | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function enter(input: LocalRoom, invite?: string): Promise<void> {
    if (pending) return;
    setPending(true); setError('');
    try {
      const session = await openRoom(input, invite);
      history.replaceState(null, '', `#invite=${session.invite}`);
      setRoom(session);
    } catch { setError('Could not enter the room. Start the room service or check your invitation.'); }
    finally { setPending(false); }
  }
  return <>
    {room ? <WatchRoom room={room} onLeave={() => { setRoom(null); history.replaceState(null, '', location.pathname); }} />
      : <Landing onCreate={(input) => void enter(input)} onJoin={(name, invite) => void enter({ displayName: name, name: '', reactions: true }, invite)} />}
    {(error || pending) && <p className="connection-notice" role="status">{pending ? 'Connecting to room service…' : error}</p>}
  </>;
}
