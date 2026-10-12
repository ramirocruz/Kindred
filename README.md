# Kindred

Kindred is a private watch-together app. Private rooms and shared text chat work locally. Video playback and calls are still being migrated.

## What works today

- Legacy-style compact dialogs, scrollable source tabs, source URL/file fields, shared-control settings and chat clearing. Source submission remains disabled until playback is connected.
- Fullscreen uses a full-height player with bottom-overlay controls, preserving the participant sidebar.

- Compact bottom-docked Messages panel with scrollable history. Reactions float and fade automatically, with reduced-motion support.

- Drag the divider between the movie and participants to resize the room, including fullscreen. Arrow keys adjust it; double-click resets it.
- Original extension setup guides and ZIP download are available. The bundled v0.8.0 extension targets the legacy site; React pairing is pending.

- Original-style landing page, room setup, source navigation, settings, invite/leave dialogs, collapsible chat, and fullscreen layout.
- Create a room, copy its private invitation, and join from another browser session using a display name. Only connected participants appear.
- Send messages with Enter/send. Other members receive them; Clear hides messages only for you. The last 100 messages are kept while anyone remains connected.
- Leaving or closing a tab removes its participant. Abrupt network loss is detected by Socket.IO heartbeat, not necessarily instantly.
- TypeScript room service with typed room state and signed invite validation.
- Automated tests and production builds.

LiveKit media is not connected yet. Room/chat delivery is verified in two browser sessions, not two physical devices.

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

Enter your name and select **Create a private room**. Open **Invite**, copy the link, and open it in another browser or private window. Enter another name, join, then expand **Messages**. Both terminals must stay running. Vite forwards API and socket traffic to port 3001.

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

Invitations grant access to anyone who has the link; they are not account-based permissions. They expire after 24 hours or a service restart. Rooms are stored in memory; chat history is deleted when the last member leaves. Reloading asks you to join again. A reconnect after ticket expiry requires a new room.

The app is not ready for public use. Media, public-service hardening, persistent-storage decisions, and two-device verification remain. The dependency check reports 20 moderate advisories requiring review before deployment.
