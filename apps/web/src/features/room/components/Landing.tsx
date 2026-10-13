import { useState } from "react";
import { createLocalRoom } from "../local-room";
import type { LocalRoom } from "../local-room";
import { parseInviteLink } from "../services/session";
import { Dialog } from "./Dialog";
export function Landing({
  onCreate,
  onJoin,
}: {
  onCreate: (room: LocalRoom) => void;
  onJoin: (name: string, invite: string) => void;
}): React.JSX.Element {
  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("Friday Night Picks");
  const [reactions, setReactions] = useState(true);
  const initialInvite = parseInviteLink(location.href, location.href);
  const [modal, setModal] = useState<"create" | "join" | null>(initialInvite ? 'join' : null);
  const [inviteLink, setInviteLink] = useState(initialInvite ? location.href : '');
  const parsedInvite = parseInviteLink(inviteLink, location.href);
  return (
    <main className="landing">
      <section className="hero">
        <p className="eyebrow">
          Private watch parties for your favourite people
        </p>
        <h1>Kindred</h1>
        <h2>
          Same show. Same moment.
          <br />
          Different sofas.
        </h2>
        <p className="hero-description">
          Kindred is your warm little corner of the internet for synced video,
          real conversation, and the kind of reactions that make a movie better.
        </p>
        <label className="name-line">
          Your name{" "}
          <input
            maxLength={24}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should we call you?"
          />
        </label>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => setModal("create")}>
            Create a private room →
          </button>
          <button className="secondary-button" onClick={() => setModal("join")}>
            Join with a room link
          </button>
        </div>
        <div className="feature-grid">
          <article>
            <span>◎</span>
            <h3>Watch in sync</h3>
            <p>Share a video and keep every screen together.</p>
          </article>
          <article>
            <span>◌</span>
            <h3>See & hear friends</h3>
            <p>
              Camera, microphone, and screen-share controls live in the room.
            </p>
          </article>
          <article>
            <span>✦</span>
            <h3>Your room, your rules</h3>
            <p>Private room links, shared controls, chat, and reactions.</p>
          </article>
        </div>
        <p className="preview-note">
          Private rooms and encrypted chat · movie playback is being migrated.
        </p>
      </section>
      {modal === "create" && (
        <Dialog
          title="Bring the couch online."
          eyebrow="New private watch party"
          onClose={() => setModal(null)}
        >
          <p className="dialog-description">
            Choose your name and room settings. Anyone with your private invitation can join.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onCreate(createLocalRoom(name, roomName, reactions));
            }}
          >
            <label className="field">
              Your display name
              <input
                required
                maxLength={24}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="field">
              Room name
              <input
                required
                maxLength={50}
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
            </label>
            <div className="setting">
              <div>
                <h3>Shared room controls</h3>
                <p>
                  Everyone in the room can choose sources and play, pause, or
                  seek compatible video.
                </p>
              </div>
              <span className="badge">Everyone</span>
            </div>
            <div className="setting">
              <div>
                <h3>Instant reactions</h3>
                <p>Let everyone send reactions during the show.</p>
              </div>
              <button
                type="button"
                className="switch"
                role="switch"
                aria-label="Instant reactions"
                aria-checked={reactions}
                onClick={() => setReactions(!reactions)}
              >
                <span />
              </button>
            </div>
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={!name.trim() || !roomName.trim()}
              >
                Create private room →
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {modal === "join" && (
        <Dialog
          title="Join your people."
          eyebrow="Private room invite"
          onClose={() => setModal(null)}
        >
          <p className="dialog-description">Enter your name and the full invitation link so you can join and read the room’s encrypted chat.</p>
          <label className="field">Your display name<input value={name} maxLength={24} onChange={(event) => setName(event.target.value)} /></label>
          <label className="field">Room link<input value={inviteLink} onChange={(event) => setInviteLink(event.target.value)} /></label>
          <div className="dialog-actions">
            <button
              className="primary-button"
              disabled={!name.trim() || !parsedInvite}
              onClick={() => onJoin(name.trim(), inviteLink)}
            >
              Join room →
            </button>
            <button className="secondary-button" onClick={() => setModal(null)}>
              Close
            </button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
