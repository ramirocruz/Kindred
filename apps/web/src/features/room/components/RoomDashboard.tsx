import { ParticipantCard } from './ParticipantCard';
import type { RoomPreviewAction, RoomSnapshot } from '../types';

interface RoomDashboardProps {
  room: RoomSnapshot;
  dispatch: React.Dispatch<RoomPreviewAction>;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

export function RoomDashboard({ room, dispatch }: RoomDashboardProps): React.JSX.Element {
  const localMember = room.members.find((member) => member.role === 'creator');

  return (
    <main className="min-h-dvh bg-[#07120f] px-4 py-5 text-stone-100 sm:px-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-300">Kindred preview</p>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{room.name}</h1>
        </div>
        <button className="secondary-button" type="button">Invite</button>
      </header>

      <section className="mx-auto mt-6 grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="rounded-3xl border border-white/10 bg-[#0d1f19] p-3 shadow-2xl shadow-black/30">
          <div className="grid aspect-video place-items-center rounded-2xl bg-[radial-gradient(circle_at_center,#234a3b,#07100d_65%)]">
            <p className="text-center text-sm text-stone-300">LiveKit media renders here after room service configuration.</p>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              className="primary-button size-12 rounded-full p-0"
              aria-label={room.playback.isPlaying ? 'Pause shared playback' : 'Play shared playback'}
              onClick={() => dispatch({ type: 'playback/toggle' })}
              type="button"
            >
              {room.playback.isPlaying ? 'Ⅱ' : '▶'}
            </button>
            <input
              aria-label="Playback position"
              className="accent-lime-300"
              max="7200"
              min="0"
              onChange={(event) => dispatch({ type: 'playback/seek', positionSeconds: Number(event.target.value) })}
              type="range"
              value={room.playback.positionSeconds}
            />
            <span className="text-sm tabular-nums text-stone-300">{formatTime(room.playback.positionSeconds)}</span>
          </div>
        </section>

        <aside className="rounded-3xl border border-white/10 bg-[#10241d] p-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">In the room · {room.members.length}</h2>
            <span className="text-xs text-lime-300">Mock preview</span>
          </div>
          <div className="grid gap-3">
            {room.members.map((member) => (
              <ParticipantCard
                key={member.id}
                member={member}
                onToggleCamera={member.id === localMember?.id ? () => dispatch({ type: 'self/toggle-camera' }) : undefined}
                onToggleMicrophone={member.id === localMember?.id ? () => dispatch({ type: 'self/toggle-microphone' }) : undefined}
              />
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
