import { useEffect, useRef, useState, type RefObject, type ReactNode } from 'react';
import type { RoomConnection } from '../useRoomConnection';
import { MediaIcon } from './MediaIcon';

export function GDriveVideo({ stream, videoRef, onError, children }: {
  stream: MediaStream | null; videoRef: RefObject<HTMLVideoElement | null>; onError: (message: string) => void; children?: ReactNode;
}): React.JSX.Element {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) void video.play().catch(() => onError('Click the speaker button to enable tab audio.'));
    return () => { video.pause(); video.srcObject = null; };
  }, [stream, videoRef, onError]);
  return <div className="welcome-screen drive-stage"><video ref={videoRef} autoPlay playsInline muted aria-label="Shared Google Drive video" />
    {!stream && <p className="drive-connecting" role="status">Connecting to the presenter’s video…</p>}
    {children}
  </div>;
}

export function formatPlaybackTime(value: number | null): string {
  const seconds = Math.floor(value ?? 0);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function GDriveControls({ connection, muted, onMute, onFullscreen, onError }: {
  connection: RoomConnection; muted: boolean; onMute: () => void; onFullscreen: () => void; onError: (message: string) => void;
}): React.JSX.Element {
  const [draft, setDraft] = useState<number | null>(null);
  const draftRef = useRef<number | null>(null);
  const playback = connection.presentation?.playback;
  const connected = connection.status === 'Connected';
  const ready = Boolean(playback && connected && !connection.presentation?.error);
  const action = (command: Parameters<RoomConnection['controlDrive']>[0]): void => {
    void connection.controlDrive(command).catch((error: unknown) => onError(error instanceof Error ? error.message : 'Playback failed.'));
  };
  const seek = (): void => {
    if (draftRef.current === null) return;
    const time = draftRef.current; draftRef.current = null; setDraft(null); action({ action: 'seek', time });
  };
  return <>
    <label className="drive-timeline"><input type="range" aria-label="Seek shared Drive video" min="0" max={playback?.duration ?? 1} step="0.1"
      value={draft ?? playback?.time ?? 0} disabled={!ready || !playback?.duration}
      onChange={(event) => { const time = Number(event.target.value); draftRef.current = time; setDraft(time); }}
      onPointerUp={seek} onKeyUp={seek} onBlur={seek} />
      <span>{formatPlaybackTime(draft ?? playback?.time ?? 0)} / {formatPlaybackTime(playback?.duration ?? null)}</span>
    </label>
    <div className="control-buttons">
      <button className="round lime" aria-label={playback?.paused ? 'Play Drive video' : 'Pause Drive video'} disabled={!ready}
        onClick={() => action({ action: playback?.paused ? 'play' : 'pause' })}>{playback?.paused ? '▶' : 'Ⅱ'}</button>
      <button className="round" aria-label="Back 10 seconds" disabled={!ready} onClick={() => action({ action: 'seek', time: Math.max(0, (playback?.time ?? 0) - 10) })}>↶<small>10</small></button>
      <button className="round" aria-label="Forward 10 seconds" disabled={!ready} onClick={() => action({ action: 'seek', time: Math.min(playback?.duration ?? 0, (playback?.time ?? 0) + 10) })}>↷<small>10</small></button>
      <button className="round" aria-label={muted ? 'Unmute tab audio' : 'Mute tab audio'} aria-pressed={!muted} onClick={onMute}><MediaIcon name="speaker" muted={muted} /></button>
      <button className="round" aria-label="Re-sync Drive video" disabled={!connected} onClick={() => action({ action: 'state' })}>↻</button>
      <button className="round" aria-label="Toggle fullscreen" onClick={onFullscreen}><MediaIcon name="fullscreen" /></button>
      <span className="control-status">{ready ? 'Tab connected' : 'Connecting'}</span>
    </div>
    <span className="badge">Everyone can control</span>
  </>;
}
