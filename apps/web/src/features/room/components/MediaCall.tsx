import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LiveKitRoom, RoomAudioRenderer, StartAudio, VideoTrack, useTracks, useTrackToggle, useConnectionState } from '@livekit/components-react';
import { ConnectionState, Track } from 'livekit-client';
import { requestRoomSession, type RoomSession as MediaSession } from '../services/room-api';
import type { RoomSession } from '../services/session';
import { MediaIcon } from './MediaIcon';

function CallToggle({ source, onError }: { source: Track.Source.Camera | Track.Source.Microphone; onError: (error: Error) => void }): React.JSX.Element {
  const { buttonProps, enabled, pending } = useTrackToggle({ source, onDeviceError: onError });
  const camera = source === Track.Source.Camera;
  return <button {...buttonProps} disabled={pending} aria-label={camera ? (enabled ? 'Turn camera off' : 'Turn camera on') : (enabled ? 'Mute microphone' : 'Turn microphone on')}>
    <MediaIcon name={camera ? 'camera' : 'microphone'} muted={!enabled} />
  </button>;
}

function CallCards({ session, members }: { session: RoomSession; members: { id: string; displayName: string }[] }): React.JSX.Element {
  const tracks = useTracks([Track.Source.Camera]);
  const connection = useConnectionState();
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  return <>
    {members.map((member) => {
      const camera = tracks.find((track) => track.participant.identity === member.id && !track.publication.isMuted);
      const local = member.id === session.identity;
      return <div key={member.id} className={`call-card ${expanded === member.id ? 'enlarged' : ''}`}>
        {camera ? <VideoTrack trackRef={camera} className={local ? 'camera-video self-camera' : 'camera-video'} muted={local} /> : <div className="avatar"><span /><b /></div>}
        <span className="member-label">{member.displayName}<i /></span>
        <button className="card-zoom" aria-label={`Resize ${member.displayName} video`} onClick={() => setExpanded(expanded === member.id ? null : member.id)}><MediaIcon name="fullscreen" /></button>
        {local && connection === ConnectionState.Connected && <div className="call-controls">
          <CallToggle source={Track.Source.Camera} onError={() => setError('Camera unavailable. Check browser permissions and your device.')} />
          <CallToggle source={Track.Source.Microphone} onError={() => setError('Microphone unavailable. Check browser permissions and your device.')} />
        </div>}
      </div>;
    })}
    <RoomAudioRenderer />
    <StartAudio className="secondary-button" label="Enable call audio" />
    <p className="preview-note" role="status">Call: {connection}{error && ` · ${error}`}</p>
  </>;
}

export function MediaCall({ session, members, children }: { session: RoomSession; members: { id: string; displayName: string }[]; children: ReactNode }): React.JSX.Element {
  const [media, setMedia] = useState<MediaSession | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function join(): Promise<void> {
    setPending(true); setError('');
    try {
      const result = await requestRoomSession('', session.id, session.displayName, session.ticket);
      if (mounted.current) setMedia(result);
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Could not connect the call.');
    } finally { if (mounted.current) setPending(false); }
  }
  return media ? <>
    <LiveKitRoom serverUrl={media.liveKitUrl} token={media.liveKitToken} audio={false} video={false}
      onError={() => setError('Call connection failed. Leave the call and try again.')}
      onDisconnected={() => { setMedia(null); setError('Call disconnected. You can join again.'); }}>
      <CallCards session={session} members={members} />
    </LiveKitRoom>
    <button className="secondary-button" onClick={() => setMedia(null)}>Leave call</button>
    {error && <p role="alert" className="preview-note">{error}</p>}
  </> : <>
    {children}
    <button className="secondary-button" disabled={pending} onClick={() => void join()}>{pending ? 'Connecting call…' : 'Join call'}</button>
    <p className="preview-note">Camera and microphone stay off until you enable them.</p>
    {error && <p role="alert" className="preview-note">{error}</p>}
  </>;
}
