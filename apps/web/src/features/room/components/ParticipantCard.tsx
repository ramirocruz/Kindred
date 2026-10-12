import type { RoomMember } from '../types';

interface ParticipantCardProps {
  member: RoomMember;
  onToggleCamera?: () => void;
  onToggleMicrophone?: () => void;
}

function CameraIcon({ isEnabled }: { isEnabled: boolean }): React.JSX.Element {
  return <span aria-hidden="true">{isEnabled ? '◉' : '◌'}</span>;
}

function MicrophoneIcon({ isEnabled }: { isEnabled: boolean }): React.JSX.Element {
  return <span aria-hidden="true">{isEnabled ? '◉' : '◌'}</span>;
}

export function ParticipantCard({
  member,
  onToggleCamera,
  onToggleMicrophone,
}: ParticipantCardProps): React.JSX.Element {
  const isLocal = member.role === 'creator';

  return (
    <article className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-emerald-950 p-3">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,#e8c99d_0_14%,transparent_15%),radial-gradient(ellipse_at_50%_105%,#b5d3c0_0_30%,transparent_31%)] opacity-80" />
      <p className="relative w-fit rounded-md bg-black/45 px-2 py-1 text-xs font-semibold text-white">{member.displayName}</p>
      <span className="absolute right-3 top-3 size-2 rounded-full bg-lime-300" aria-label="Connected" />
      {isLocal ? (
        <div className="absolute bottom-2 left-2 flex gap-1 rounded-xl bg-black/70 p-1 opacity-100 transition-opacity sm:pointer-events-none sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100">
          <button className="media-button" aria-label="Toggle camera" onClick={onToggleCamera} type="button">
            <CameraIcon isEnabled={member.isCameraOn} />
          </button>
          <button className="media-button" aria-label="Toggle microphone" onClick={onToggleMicrophone} type="button">
            <MicrophoneIcon isEnabled={member.isMicrophoneOn} />
          </button>
        </div>
      ) : null}
    </article>
  );
}
