# Kindred

Private watch parties built with React, Vite, TypeScript and PeerJS/WebRTC. Room membership and encrypted chat run in browsers. There is no application room API, Socket.IO service or LiveKit dependency.

## Run locally

Install Node.js 20.19+ or 22.12+ and npm 11+. Open a terminal in the Kindred folder, then run:

```sh
npm ci
```

This installs dependencies. Start the connection helper in one terminal:

```sh
npm run signaling
```

Start the app in a second terminal:

```sh
npm run dev
```

Open the address printed by Vite, normally [localhost:5173](http://localhost:5173). Create a room, use **Invite** to copy its full link, and open it in another tab/browser. Enter a name to join. Both terminals must remain running; Ctrl+C stops them.

`signaling` runs the official PeerServer on `127.0.0.1:9000`. It helps browsers connect; it does not keep room membership, names, chat history or playback state. Local defaults use no third-party STUN/TURN servers.

Localhost works only on your computer. Friends elsewhere need a hosted static app, an HTTPS self-hosted signaling endpoint and suitable self-hosted STUN/TURN configuration.

## Room hosts and leaving

The creator browser initially coordinates the room. Members keep copies of the membership order and encrypted chat history. After the host leaves, members poll for a successor in admission order. The eldest reachable member must acquire the stable signaling room address before becoming host. The same invite continues to work after handover.

A returning creator joins as a regular member with a new admission position. The host name appears below the participant cards. Host authority coordinates room updates; it does not give exclusive playback permissions.

Normal departure recovery uses a seven-second heartbeat window plus connection setup; hard network failures may take longer. Updates pause when authority is uncertain or signaling ownership is lost. This relies on one trusted PeerServer namespace; it is not a consensus system for malicious members or arbitrary network partitions.

There is no database. If everyone leaves, the live room ends. Closing the only host tab ends that room. Old room-service invitations must be replaced by newly created browser-room links.

## Calls

Select **Join call**, then hover over your own card to enable the camera or microphone. Both start off. **Leave call** stops media while keeping you in the room. Your preview is mirrored; outgoing video is unchanged.

Only one Kindred tab per browser origin may join a call at a time, preventing duplicate audio from old tabs. Leave the old call before joining another. Current browsers with the Web Locks API are required; chat works independently.

Microphones request echo cancellation, noise suppression and automatic gain control. Each remote member has one rendered inbound audio/video stream. Video requests up to 720p at 24–30 fps; browsers negotiate codecs and adapt transport to available bandwidth. This does not guarantee noise-free calls.

PeerJS media is connected in code and its cleanup/deduplication has focused tests. Physical-device audio/video, TURN-only calls and real network recovery still require verification. Room-authority changes cannot inherit a departed presenter's screen stream or local file.

## Private chat

The browser creates a random AES-256-GCM chat key and includes it in the invitation fragment after `#`. Chat and room-control frames are encrypted in browsers before crossing WebRTC. PeerServer receives connection signaling, not chat plaintext or the room key. It can still observe peer IDs, IP-related signaling and timing. Direct P2P may reveal your IP to other members.

Treat the full link like a password. Anyone with it can join and read retained chat. It can remain in browser history or the clipboard. Keys are not written to localStorage. Encryption failures never fall back to plaintext.

This shared invitation-key design has no forward secrecy, automatic key rotation or independent human identity verification. To exclude someone who saved an invite, create a new room and share its link only with the remaining people. Members, browser extensions, devices and delivered app code remain trusted.

Rooms currently allow 16 members and retain the latest 100 encrypted messages in browser memory. Chat is capped at 10,000 accepted messages per coordinator. Clear hides messages only for you. A message that cannot be decrypted appears as unavailable.

## Connection settings

Defaults work for local direct connections. To override them, copy the example:

```sh
cp apps/web/.env.example apps/web/.env.local
```

Edit `.env.local` and restart Vite:

- `VITE_PEER_SERVER_URL`: your HTTPS PeerServer endpoint. HTTP is accepted only on loopback.
- `VITE_ICE_SERVERS`: a JSON array of your STUN/TURN settings. Default: `[]`.
- `VITE_RELAY_ONLY`: set to `true` to force TURN and conceal participant IPs from each other. Requires TURN configuration.

Never put a TURN administrator/shared secret or other private server key in a `VITE_*` variable: these values reach browsers. Production needs a separate trusted way to issue temporary TURN credentials; that is not implemented here. The bundled signaling command binds to localhost and is a development tool, not a hardened public deployment.

## Checks

```sh
npm run typecheck
npm test
npm run build
```

The production website is generated in `apps/web/dist/`. `npm run lint` currently runs TypeScript checks, not ESLint.

## Migration status

The original landing page, source segments, compact dialogs, translucent chat/reactions, adjustable divider, fullscreen layout and participant cards remain. Encrypted room chat, shared reactions and host succession now use WebRTC.

Movie-source playback, personal-file delivery, captured-tab streaming and extension pairing are still being migrated; their source submission/player actions remain disabled. The bundled extension download is the legacy v0.8.0 build. Do not switch production until feature parity and real two-device checks pass.

The former room-service source and LiveKit dependencies are removed; previous versions are recoverable in Git. Ignored local environment/build files from earlier development may still exist and are unused.

## Project guide

- `apps/web/src/features/room/`: interface and browser room/media logic.
- `scripts/peer-server.mjs`: local signaling launcher.
- [AGENTS.md](AGENTS.md): development rules.
- `Context/index.md`: ignored local project notes; unavailable in fresh clones.
- [Architecture diagram](.archify/architecture-kindred-20261013-020518/kindred.html): interactive HTML snapshot of the older service architecture, awaiting update.

To open the diagram on macOS:

```sh
open .archify/architecture-kindred-20261013-020518/kindred.html
```
