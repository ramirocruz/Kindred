import { useRef, useState } from "react";
import { sources } from "../local-room";
import type { LocalRoom, Source } from "../local-room";
import { Dialog } from "./Dialog";
import { MediaIcon } from "./MediaIcon";
import { RoomDivider } from "./RoomDivider";
import { ExtensionSetup } from "./ExtensionSetup";
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
  room: LocalRoom;
  onLeave: () => void;
}): React.JSX.Element {
  const [source, setSource] = useState<Source | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [modal, setModal] = useState<
    "invite" | "setup" | "settings" | "source" | null
  >(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [reactions, setReactions] = useState(room.reactions);
  const [interactive, setInteractive] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [reaction, setReaction] = useState("");
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
          {room.name} · Local preview · 1 here
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
            {reaction && (
              <button
                className="reaction-pop"
                aria-label="Dismiss reaction"
                onClick={() => setReaction("")}
              >
                {reaction}
              </button>
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
                  onClick={() => setReaction(emoji)}
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
              <h2>In the room 1</h2>
              <button onClick={() => setModal("invite")}>+ Invite</button>
            </div>
            <div className={`call-card ${zoom ? "enlarged" : ""}`}>
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
            </div>
            <p className="preview-note">
              Camera and microphone connect in the next phase.
            </p>
          </section>
          <p className="sidebar-note">
            Local preview · online invites coming next.
          </p>
          <section className="chat">
            <button
              className="chat-heading"
              aria-expanded={chatOpen}
              onClick={() => setChatOpen(!chatOpen)}
            >
              Messages <span>{chatOpen ? "−" : "+"}</span>
            </button>
            {chatOpen && (
              <div className="chat-content">
                <p>
                  Messages will appear here when online rooms are connected.
                </p>
                <input
                  disabled
                  aria-label="Chat unavailable in local preview"
                  placeholder="Say something nice…"
                />
              </div>
            )}
          </section>
        </aside>
      </div>
      {notice && <p role="status">{notice}</p>}
      {modal === 'setup' && <ExtensionSetup gdrive={source === 'GDrive'} onClose={() => setModal(null)} />}
      {modal && modal !== 'setup' && (
        <Dialog
          eyebrow={modal === "invite" ? "Private room invite" : "Kindred room"}
          title={
            modal === "invite"
              ? "Bring your people together."
              : modal === "settings"
                ? "Your room, your rules."
                : modal === "source"
                  ? copy?.action || "Choose a video"
                  : "Shared tab control"
          }
          onClose={() => setModal(null)}
        >
          {modal === "settings" ? (
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
          ) : (
            <p className="dialog-description">
              {modal === "invite"
                ? "This room currently runs on your device. Shareable private links will be enabled when online rooms are connected."
                : modal === "source"
                  ? "This source is being migrated. Playback is not connected in this interface yet."
                  : "GDrive uses playback controls. Screen share offers viewing or interactive control. Extension pairing is being migrated; the new room cannot link a tab yet."}
            </p>
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
