import { useRef, useState } from "react";
import { sources } from "../local-room";
import type { Source } from "../local-room";
import type { RoomSession } from '../services/session';
import { useRoomConnection } from '../useRoomConnection';
import { Dialog } from "./Dialog";
import { MediaIcon } from "./MediaIcon";
import { RoomDivider } from "./RoomDivider";
import { ExtensionSetup } from "./ExtensionSetup";
import { RoomChat } from "./RoomChat";
import { SourceSetup } from "./SourceSetup";
import type { CSSProperties } from "react";

const sourceCopy: Record<
  Source,
  { title: string; description: string; action: string }
> = {
  YouTube: {
    title: "A whole world to watch.",
    description: "Bring a YouTube video into your room.",
    action: "Enter YouTube URL",
  },
  "Web video": {
    title: "Found something good?",
    description: "Add a direct video link to watch together.",
    action: "Enter video URL",
  },
  "Personal file": {
    title: "Your favourites, together.",
    description: "Pick a video from your device.",
    action: "Choose a video file",
  },
  GDrive: {
    title: "Your Drive. Your movie night.",
    description: "Share a Google Drive video using Kindred Tab Control.",
    action: "Set up GDrive sharing",
  },
  "Screen share": {
    title: "Share your side of the screen.",
    description: "Present a browser tab with optional interactive controls.",
    action: "Set up screen sharing",
  },
};

export function WatchRoom({
  room,
  onLeave,
}: {
  room: RoomSession;
  onLeave: () => void;
}): React.JSX.Element {
  const connection = useRoomConnection(room);
  const inviteUrl = `${location.origin}${location.pathname}#invite=${room.invite}`;
  const [source, setSource] = useState<Source | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [modal, setModal] = useState<
    "invite" | "setup" | "settings" | "source" | null
  >(null);
  const [reactions, setReactions] = useState(room.reactions);
  const [interactive, setInteractive] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [reaction, setReaction] = useState<{ emoji: string; id: number } | null>(null);
  const reactionSequence = useRef(0);
  const [notice, setNotice] = useState("");
  const stage = useRef<HTMLDivElement>(null);
  const copy = source ? sourceCopy[source] : null;
  async function toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.current?.requestFullscreen();
    } catch {
      setNotice("Fullscreen is unavailable in this browser.");
    }
  }
  return (
    <div className="watch-room" ref={stage}>
      <header className="room-header">
        <button className="brand" onClick={onLeave}>
          <span>⌁</span>Kindred
        </button>
        <span className="room-pill">
          <i />
          {room.name} · {connection.status} · {connection.members.length} here
        </span>
        <div className="header-actions">
          <button
            className="secondary-button"
            onClick={() => setModal("setup")}
          >
            Set up tab sharing
          </button>
          <button
            className="secondary-button"
            onClick={() => setModal("invite")}
          >
            ↗ Invite
          </button>
          <button
            className="secondary-button"
            aria-label="Room settings"
            onClick={() => setModal("settings")}
          >
            ⚙
          </button>
        </div>
      </header>
      <div className="room-grid" style={{ '--sidebar-width': `${sidebarWidth}px` } as CSSProperties}>
        <section className="player-panel">
          <nav className="source-tabs" aria-label="Video sources">
            {sources.map((item) => (
              <button
                key={item}
                className={
                  source === item ? "primary-button" : "secondary-button"
                }
                aria-pressed={source === item}
                onClick={() => setSource(item)}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="welcome-screen">
            <p className="eyebrow">{source || "Room is ready"}</p>
            <h1>{copy?.title || "Welcome to Kindred"}</h1>
            <p>
              {copy?.description ||
                "Choose a source above to begin. Make yourself comfortable."}
            </p>
            {copy ? (
              <>
                <button
                  className="primary-button"
                  onClick={() =>
                    setModal(
                      source === "GDrive" || source === "Screen share"
                        ? "setup"
                        : "source",
                    )
                  }
                >
                  {copy.action} →
                </button>
                {source === "Screen share" && (
                  <label className="interactive-option">
                    <input
                      type="checkbox"
                      checked={interactive}
                      onChange={(e) => setInteractive(e.target.checked)}
                    />
                    Interactive control
                  </label>
                )}
              </>
            ) : (
              <div className="welcome-feature">
                <span className="artwork">✦</span>
                <div>
                  <h3>The best part is the company</h3>
                  <p>Your next movie night starts here</p>
                </div>
                <span className="round lime">▶</span>
              </div>
            )}
            {reactions && reaction && (
              <span
                key={reaction.id}
                className="reaction-pop"
                role="status"
                aria-label={`Reaction ${reaction.emoji}`}
                onAnimationEnd={() => setReaction((current) => current?.id === reaction.id ? null : current)}
              >
                {reaction.emoji}
              </span>
            )}
          </div>
          <div className="player-controls">
            <div className="control-buttons">
              <button className="round lime" aria-label="Play" disabled>
                ▶
              </button>
              <button className="round" aria-label="Back 10 seconds" disabled>
                ↶<small>10</small>
              </button>
              <button
                className="round"
                aria-label="Forward 10 seconds"
                disabled
              >
                ↷<small>10</small>
              </button>
              <button className="round" aria-label="Mute audio" disabled>
                <MediaIcon name="speaker" muted />
              </button>
              <button className="round" aria-label="Re-sync" disabled>
                ↻
              </button>
              <button
                className="round"
                aria-label="Toggle fullscreen"
                onClick={() => void toggleFullscreen()}
              >
                <MediaIcon name="fullscreen" />
              </button>
              <span className="control-status">Choose a video</span>
            </div>
            <span className="badge">Everyone can control</span>
          </div>
          {reactions && (
            <div className="reactions" aria-label="Reactions">
              {["😂", "❤️", "😱", "👏", "🍿"].map((emoji) => (
                <button
                  key={emoji}
                  aria-label={`React ${emoji}`}
                  onClick={() => setReaction({ emoji, id: ++reactionSequence.current })}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </section>
        <RoomDivider width={sidebarWidth} onResize={setSidebarWidth} />
        <aside className="room-sidebar">
          <section className="participants">
            <div className="panel-heading">
              <h2>In the room {connection.members.length}</h2>
              <button onClick={() => setModal("invite")}>+ Invite</button>
            </div>
            {connection.members.some((member) => member.id === room.identity) && <div className={`call-card ${zoom ? "enlarged" : ""}`}>
              <span className="member-label">
                {room.displayName}
                <i />
              </span>
              <div className="avatar">
                <span />
                <b />
              </div>
              <button
                className="card-zoom"
                aria-label={zoom ? "Restore video card" : "Enlarge video card"}
                onClick={() => setZoom(!zoom)}
              >
                <MediaIcon name="fullscreen" />
              </button>
              <div className="call-controls">
                <button
                  title="Camera available when calls are connected"
                  aria-label="Camera unavailable"
                  disabled
                >
                  <MediaIcon name="camera" muted />
                </button>
                <button
                  title="Microphone available when calls are connected"
                  aria-label="Microphone unavailable"
                  disabled
                >
                  <MediaIcon name="microphone" muted />
                </button>
              </div>
            </div>}
            {connection.members.filter((member) => member.id !== room.identity).map((member) => (
              <div className="call-card" key={member.id}>
                <span className="member-label">{member.displayName}<i /></span>
                <div className="avatar"><span /><b /></div>
              </div>
            ))}
            <p className="preview-note">
              Camera and microphone connect in the next phase.
            </p>
          </section>
          <p className="sidebar-note">
            {connection.status} · private invitation room.
          </p>
          <RoomChat connection={connection} />
        </aside>
      </div>
      {notice && <p role="status">{notice}</p>}
      {modal === 'setup' && <ExtensionSetup gdrive={source === 'GDrive'} onClose={() => setModal(null)} />}
      {modal === 'source' && source && <SourceSetup source={source} onClose={() => setModal(null)} />}
      {modal && modal !== 'setup' && modal !== 'source' && (
        <Dialog
          eyebrow={modal === "invite" ? "Private room invite" : "Kindred room"}
          title={
            modal === "invite"
              ? "Send this exact room link."
              : modal === "settings"
                ? "Make it yours."
                : "Shared tab control"
          }
          onClose={() => setModal(null)}
        >
          {modal === "settings" ? (
            <>
            <div className="setting">
              <div><h3>Shared room controls</h3><p>All connected members can play, pause, seek, and change the source.</p></div>
              <span className="badge">Everyone</span>
            </div>
            <div className="setting">
              <div>
                <h3>Instant reactions</h3>
                <p>Let everyone send reactions during the show.</p>
              </div>
              <button
                className="switch"
                role="switch"
                aria-label="Instant reactions"
                aria-checked={reactions}
                onClick={() => setReactions(!reactions)}
              >
                <span />
              </button>
            </div>
            <p className="preview-note">Settings apply to this local preview. Guest permissions require online rooms.</p>
            </>
          ) : (
            <>
            <p className="dialog-description">
              {modal === "invite"
                ? "Anyone with this link can join. It expires after 24 hours or a service restart. Keep it private."
                : "GDrive uses playback controls. Screen share offers viewing or interactive control. Extension pairing is being migrated; the new room cannot link a tab yet."}
            </p>
            <label className="field">Room link<input readOnly value={inviteUrl} onFocus={(event) => event.target.select()} /></label>
            <button className="primary-button" onClick={() => void navigator.clipboard.writeText(inviteUrl).then(() => setNotice('Invite link copied.')).catch(() => setNotice('Select and copy the room link manually.'))}>Copy link</button>
            </>
          )}
          <div className="dialog-actions">
            {modal === "invite" && (
              <button className="secondary-button leave" onClick={onLeave}>
                Leave room
              </button>
            )}
            <button className="secondary-button" onClick={() => setModal(null)}>
              Close
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
