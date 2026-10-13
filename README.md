# Kindred

Kindred is a private watch-together app. Private rooms and invite-key encrypted shared chat work locally. Video playback and calls are still being migrated.

## Architecture diagram

[Open the interactive project diagram](.archify/architecture-kindred-20261013-020518/kindred.html) to explore how the interface, room service and LiveKit connect.

If your Markdown viewer does not open HTML, run this from the project folder on macOS:

```sh
open .archify/architecture-kindred-20261013-020518/kindred.html
```

No app server is needed. The diagram is a saved snapshot: it predates encrypted chat and the decision to replace LiveKit with PeerJS. Read the sections below for current status.

## What works today

- Legacy-style compact dialogs, scrollable source tabs, source URL/file fields, shared-control settings and chat clearing. Source submission remains disabled until playback is connected.
- Fullscreen uses a full-height player with bottom-overlay controls, preserving the participant sidebar.

- Compact bottom-docked Messages panel with scrollable history. Reactions float and fade automatically, with reduced-motion support.

- Drag the divider between the movie and participants to resize the room, including fullscreen. Arrow keys adjust it; double-click resets it.
- Original extension setup guides and ZIP download are available. The bundled v0.8.0 extension targets the legacy site; React pairing is pending.

- Original-style landing page, room setup, source navigation, settings, invite/leave dialogs, collapsible chat, and fullscreen layout.
- Create a room, copy its private invitation, and join from another browser session using a display name. Only connected participants appear.
- Send invite-key encrypted messages with Enter/send. Other members receive decrypted messages in the browser; the room service stores and broadcasts ciphertext envelopes only. Clear hides messages only for you. The last 100 encrypted messages are kept while anyone remains connected.
- Leaving or closing a tab removes its participant. Abrupt network loss is detected by Socket.IO heartbeat, not necessarily instantly.
- TypeScript room service with typed room state and signed invite validation.
- Automated tests and production builds.

LiveKit call UI is integrated but requires your media server configuration; live audio/video delivery has not been verified. Room/chat delivery is verified in two browser sessions, not two physical devices.

## Camera and microphone setup

PeerJS/WebRTC with self-hosted signaling and STUN/TURN is now the approved target. The LiveKit implementation below still exists until that replacement is tested.

Set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` in the room service's ignored `.env.local`, then restart the service. Use a LiveKit Cloud project or your own LiveKit server. Never place the API secret in the web app.

In a room, select **Join call**. Camera and microphone start off; hover over your card to enable them. Your own preview is mirrored; outgoing video is unchanged. If the browser blocks sound, select **Enable call audio**. **Leave call** disconnects media without leaving chat.

Use HTTPS outside localhost. Two-device video/audio, permissions, reconnection and device cleanup still require live verification before release.

## Encrypted chat and private links

Each new room gets a random chat key generated in the browser. The full invitation carries it after `#` in the URL. The browser sends only encrypted message content to the room service; the service keeps sender names and other room metadata visible. Anyone with the full link can join and read the retained chat history.

Treat invitations like passwords. The key can remain in browser history and copied links; no key is written to localStorage or sent in our HTTP/socket requests. Use HTTPS outside localhost and share links through a trusted channel. A browser extension, compromised device or modified app code can still read chat.

This invite-key design has no forward secrecy or automatic key rotation. Leaving does not revoke a saved invitation. To exclude a previous member, create a new room and share its new link only with the remaining people. It is not an audited group messaging protocol or independent identity verification.

The service retains at most 100 encrypted messages while the room is occupied. Replay tracking is bounded: after 10,000 accepted messages, create a new room. Missing or invalid encryption never falls back to plaintext. A message that fails decryption appears as unavailable while other messages remain usable. Old links without a chat key must be replaced with a new full invitation.

## What you need

- Node.js `20.19+` or `22.12+`.
- npm `11+`.

Check them:

```sh
node --version
npm --version
```

## First setup

From this project folder:

```sh
npm ci
```

This downloads the project dependencies. Run it again after pulling a changed `package-lock.json`.

## Run locally (two terminals)

First configure the room service:

```sh
cp apps/room-service/.env.example apps/room-service/.env.local
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copy the generated value into `ROOM_TICKET_SECRET` in `.env.local`. Keep `WEB_ORIGIN=http://localhost:5173`. Leave LiveKit lines commented out for now.

Terminal 1 — start the room service:

```sh
set -a
source apps/room-service/.env.local
set +a
npm run dev --workspace=@kindred/room-service
```

Terminal 2 — start the interface:

```sh
npm run dev
```

Open the address printed in the terminal, normally `http://localhost:5173`.

Enter your name and select **Create a private room**. Open **Invite**, copy the full link, and open it in another browser or private window. The `chatKey` parameter stays in the URL fragment; do not remove it or guests cannot decrypt chat. Enter another name, join, then expand **Messages**. Both terminals must stay running. Vite forwards API and socket traffic to port 3001.

`localhost` links only work on your computer. Internet sharing requires a deployed service and HTTPS configuration; do not expose the development server publicly.

## Run the room service

Rooms/chat do not need LiveKit. When media integration is ready, uncomment the LiveKit values in `.env.local` and supply your own credentials.

```sh
cp apps/room-service/.env.example apps/room-service/.env.local
```

If the file already exists, do not overwrite it. Set the required secret and origin, then run:

```sh
set -a
source apps/room-service/.env.local
set +a
npm run dev --workspace=@kindred/room-service
```

The service normally starts at `http://localhost:3001`. Keep credentials private: `.env.local` is ignored by Git.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the web preview. |
| `npm run typecheck` | Check TypeScript types. |
| `npm test` | Run focused Jest tests. |
| `npm run build` | Create production builds. |
| `npm run lint` | Run the current TypeScript-based lint check. |

Before committing changes, run:

```sh
npm run typecheck
npm test
npm run build
git diff --check
```

## Project layout

- `apps/web` — React and Vite interface.
- `apps/room-service` — API, Socket.IO room coordination, and LiveKit tokens.
- `Context` — local project notes for people and coding agents; it is intentionally not committed.

Read [Context/README.md](Context/README.md) and [AGENTS.md](AGENTS.md) before making project changes.

## Current limitation

Invitations grant access to anyone who has the full link; they are not account-based permissions. The same full link also carries the browser-only chat key, so anyone with it can decrypt room chat while the room exists. Links expire after 24 hours or a service restart. Rooms are stored in memory; encrypted chat history is deleted when the last member leaves. Reloading asks you to join again. A reconnect after ticket expiry requires a new room.

The app is not ready for public use. Media, public-service hardening, persistent-storage decisions, and two-device verification remain. The dependency check reports 20 moderate advisories requiring review before deployment.
