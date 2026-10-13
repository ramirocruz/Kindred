import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { RoomSession } from '../services/session';
import type { RoomConnection } from '../useRoomConnection';
import { MediaIcon } from './MediaIcon';
import { reserveCall } from '../services/call-lock';

function StreamPlayer({ stream, local }: { stream: MediaStream; local: boolean }): React.JSX.Element {
  const player = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const [blocked, setBlocked] = useState(false);
  const video = stream.getVideoTracks().some((track) => track.readyState === 'live' && track.enabled);
  useEffect(() => {
    const element = player.current;
    if (!element) return;
    let disposed = false;
    element.srcObject = stream;
    void element.play().catch(() => { if (!disposed && !local) setBlocked(true); });
    return () => { disposed = true; element.srcObject = null; };
  }, [stream, local, video]);
  return <>
    {video ? <video ref={player} playsInline autoPlay muted={local} className={local ? 'camera-video self-camera' : 'camera-video'} />
      : <><div className="avatar"><span /><b /></div><audio ref={player} autoPlay muted={local} /></>}
    {blocked && <button className="secondary-button" onClick={() => void player.current?.play().then(() => setBlocked(false)).catch(() => {})}>Enable call audio</button>}
  </>;
}

export function MediaCall({ session, connection, children }: { session: RoomSession; connection: RoomConnection; children: ReactNode }): React.JSX.Element {
  const [joined, setJoined] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const local = useRef<MediaStream | null>(null);
  const releaseCall = useRef<(() => void) | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const mounted = useRef(true);
  const setRoomStream = useRef(connection.setStream);
  setRoomStream.current = connection.setStream;
  useEffect(() => {
    mounted.current = true;
    const stop = (): void => {
      local.current?.getTracks().forEach((track) => track.stop()); local.current = null; setRoomStream.current(null);
      releaseCall.current?.(); releaseCall.current = null;
    };
    const pagehide = (): void => { mounted.current = false; stop(); };
    window.addEventListener('pagehide', pagehide);
    return () => { mounted.current = false; window.removeEventListener('pagehide', pagehide); stop(); };
  }, []);

  function leave(): void {
    local.current?.getTracks().forEach((track) => track.stop());
    local.current = null; setStream(null); setJoined(false); connection.setStream(null);
    releaseCall.current?.(); releaseCall.current = null;
  }
  async function join(): Promise<void> {
    if (pending || releaseCall.current) return;
    setPending(true); setError('');
    try {
      if (!navigator.locks) throw new Error('This browser does not support safe call ownership. Try a current browser.');
      const release = await reserveCall(navigator.locks);
      if (!mounted.current) { release?.(); return; }
      if (!release) throw new Error('A call is already open in another Kindred tab. Leave that call first.');
      releaseCall.current = release;
      const next = new MediaStream(); local.current = next; setStream(next); setJoined(true); connection.setStream(next);
    } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : 'Could not join the call.'); }
    finally { if (mounted.current) setPending(false); }
  }
  async function toggle(kind: 'video' | 'audio'): Promise<void> {
    if (pending || !local.current) return;
    setPending(true); setError('');
    const current = local.current;
    try {
      const tracks = kind === 'video' ? current.getVideoTracks() : current.getAudioTracks();
      if (tracks.length) tracks.forEach((track) => { current.removeTrack(track); track.stop(); });
      else {
        const captured = await navigator.mediaDevices.getUserMedia(kind === 'video'
          ? { video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } } }
          : { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        if (!mounted.current || local.current !== current) { captured.getTracks().forEach((track) => track.stop()); return; }
        captured.getTracks().forEach((track) => current.addTrack(track));
      }
      // New stream object updates previews; old outbound calls are closed before replacement.
      const next = new MediaStream(current.getTracks());
      local.current = next; setStream(next); connection.setStream(next);
    } catch { setError('Device unavailable. Check browser permissions and try again.'); }
    finally { if (mounted.current) setPending(false); }
  }
  return joined ? <>
    {connection.members.map((member) => {
      const self = member.id === session.identity;
      const media = self ? stream : connection.streams.get(member.id);
      return <div key={member.id} className={`call-card ${expanded === member.id ? 'enlarged' : ''}`}>
        {media ? <StreamPlayer stream={media} local={self} /> : <div className="avatar"><span /><b /></div>}
        <span className="member-label">{member.displayName}<i /></span>
        <button className="card-zoom" aria-label={`Resize ${member.displayName} video`} onClick={() => setExpanded(expanded === member.id ? null : member.id)}><MediaIcon name="fullscreen" /></button>
        {self && <div className="call-controls">
          <button disabled={pending} aria-label={stream?.getVideoTracks().length ? 'Turn camera off' : 'Turn camera on'} onClick={() => void toggle('video')}><MediaIcon name="camera" muted={!stream?.getVideoTracks().length} /></button>
          <button disabled={pending} aria-label={stream?.getAudioTracks().length ? 'Mute microphone' : 'Turn microphone on'} onClick={() => void toggle('audio')}><MediaIcon name="microphone" muted={!stream?.getAudioTracks().length} /></button>
        </div>}
      </div>;
    })}
    <button className="secondary-button" onClick={leave}>Leave call</button>
    {error && <p role="alert" className="preview-note">{error}</p>}
  </> : <>
    {children}
    <button className="secondary-button" disabled={pending || connection.status !== 'Connected'} onClick={() => void join()}>{pending ? 'Joining call…' : 'Join call'}</button>
    <p className="preview-note">Camera and microphone stay off until you enable them.</p>
    {error && <p role="alert" className="preview-note">{error}</p>}
  </>;
}
