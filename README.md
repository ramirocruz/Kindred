# Kindred

Private watch parties built with React, Vite, TypeScript and PeerJS/WebRTC. Room membership and encrypted chat run in browsers. There is no application room API, Socket.IO service or LiveKit dependency.

## Run locally

Install Node.js 20.19+ or 22.12+ and npm 11+. Open a terminal in the Kindred folder, then run:

```sh
npm ci
```

This installs dependencies. Start the app:

```sh
npm run dev
```

Open the address printed by Vite, normally [localhost:5173](http://localhost:5173). Create a room, use **Invite** to copy its full link, and open it in another browser. Enter a name to join. Keep the terminal running; Ctrl+C stops it. Internet access is required for the default public signaling servers.

Like the legacy app, PeerJS uses its public signaling and STUN/TURN defaults. `npm run signaling` is optional: it runs a local PeerServer on `127.0.0.1:9000` when that endpoint is explicitly configured. Neither option manages room state.

Localhost works only on your computer. Friends elsewhere need a hosted HTTPS static app. Public connection infrastructure sees signaling metadata; TURN may relay encrypted traffic. **TODO:** decide hosting/privacy later and replace public defaults if self-hosting is selected.

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

## Google Drive playback

1. Create/join a room in Chrome at port 5173. Select **GDrive**, then **Set up GDrive sharing** and **Download extension**.
2. Unzip it. Open `chrome://extensions`, enable **Developer mode**, and select **Load unpacked** with the unzipped folder. Refresh Kindred.
3. Open and start your Drive video. Click **Kindred GDrive**, choose the room, then **Share GDrive tab**.
4. Return to Kindred and click its speaker button to hear the movie. Everyone can play/pause, seek with the timeline or ±10 seconds, and enter fullscreen. Guests need no extension.
5. Stop/unlink in the room's linked-tab dialog or extension popup. Only the presenter can revoke the tab.

The original Drive tab becomes silent during capture; movie audio is rendered once in Kindred. The capture stream is independent of camera/mic calls. GDrive uses no debugger. Browser capture indicators remain browser-owned.

This migration follows the legacy accessible-video/frame discovery and pinned-document playback commands. Unsupported/protected players fail explicitly. Actual authenticated Drive capture and remote audiovisual delivery still need manual verification; unit tests are not proof of these.

Extension source: `extensions/gdrive/`. You can also load that folder directly. Run `npm run package:extension` after editing it to refresh the download. Localhost and 127.0.0.1 on port 5173 are allowed; other origins need explicit extension allowlist changes. The v0.9.0 GDrive build is for new React rooms, not legacy invitations.

## Connection settings

Defaults match the legacy PeerJS configuration. To use self-hosted infrastructure, copy the example:

```sh
cp apps/web/.env.example apps/web/.env.local
```

Edit `.env.local` and restart Vite:

- `VITE_PEER_SERVER_URL`: blank uses public PeerJS defaults; otherwise your HTTPS PeerServer endpoint. HTTP is accepted only on loopback. For the optional local launcher, use `http://127.0.0.1:9000/kindred` and run `npm run signaling` separately.
- `VITE_ICE_SERVERS`: a JSON array of your STUN/TURN settings when an endpoint is configured. Default for self-hosting: `[]`; without an endpoint, PeerJS supplies its own ICE defaults.
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

GDrive capture/playback integration is implemented with a new v0.9.0 extension and requires real Drive/two-device verification. YouTube/web-video/personal-file delivery and interactive screen-sharing pairing remain pending; their submission/player actions remain disabled. Interactive setup still downloads the legacy v0.8.0 build, not a working React integration. Do not switch production until feature parity and real two-device checks pass.

The former room-service source and LiveKit dependencies are removed; previous versions are recoverable in Git. Ignored local environment/build files from earlier development may still exist and are unused.

## Project guide

- `apps/web/src/features/room/`: interface and browser room/media logic.
- `scripts/peer-server.mjs`: local signaling launcher.
- [AGENTS.md](AGENTS.md): development rules.
- `Context/index.md`: ignored local project notes; unavailable in fresh clones.
- [High-level design](docs/architecture.md): current browser authority, PeerJS and GDrive paths.
- [Interactive architecture diagram](.archify/architecture-kindred-20261013-152248/kindred.html): generated local Archify view of the current design; HTML is not included in fresh clones. Its authored candidate is versioned alongside it.

To open the diagram on macOS:

```sh
open .archify/architecture-kindred-20261013-152248/kindred.html
```
