# Kindred

Kindred is a private watch-together app. Friends will be able to watch media, chat, and use camera/microphone in the same room.

## What works today

- Legacy-style compact dialogs, scrollable source tabs, source URL/file fields, shared-control settings and chat clearing. Source submission remains disabled until playback is connected.
- Fullscreen uses a full-height player with bottom-overlay controls, preserving the participant sidebar.

- Compact bottom-docked Messages panel with scrollable history. Reactions float and fade automatically, with reduced-motion support.

- Drag the divider between the movie and participants to resize the room, including fullscreen. Arrow keys adjust it; double-click resets it.
- Original extension setup guides and ZIP download are available. The bundled v0.8.0 extension targets the legacy site; React pairing is pending.

- Original-style landing page, room setup, source navigation, settings, invite/leave dialogs, collapsible chat, and fullscreen layout.
- Local room preview uses your display name; no fake participants are added.
- Messages accept typing and Enter/send, and stay while you collapse chat. They are local to this preview and disappear when you leave or reload; other members cannot receive them yet.
- TypeScript room service with typed room state and signed invite validation.
- Automated tests and production builds.

LiveKit media and real multi-device rooms are not connected yet.

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

## Run the web preview

```sh
npm run dev
```

Open the address printed in the terminal, normally `http://localhost:5173`.

Enter your name and select **Create a private room** to explore the interface. Source playback, shared invites, online message delivery, and calls still need integration; unavailable actions are labelled or disabled. This does not create a real online room.

## Run the room service

The service needs LiveKit credentials before it can start.

```sh
cp apps/room-service/.env.example apps/room-service/.env.local
```

Edit `apps/room-service/.env.local` and replace every `replace-with-...` value. Then, in a second terminal:

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

The app is not ready for public use yet. Real LiveKit rooms, login/invite ticket issuance, and two-device media verification remain before deployment.
