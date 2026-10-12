# Architecture

## React migration foundation — 2026-10-12

Kindred is moving toward a React/Vite TypeScript web client, TypeScript Socket.IO room service and LiveKit media layer. The deployed static `dist/` app remains the production implementation until the replacement reaches feature parity. Room membership and playback state move from browser-hosted PeerJS state to the room service; LiveKit will own camera, microphone and presentation transport. WebTorrent remains a separate personal-file transport.

The migration workspace lives in `apps/web` and `apps/room-service`. The service accepts LiveKit configuration only from environment variables; no keys are committed. A local ignored `Context/` folder records active migration state; the existing tracked `kindred_context/` folder remains historical project documentation.

The migration room service requires a signed, unexpired room ticket for both Socket.IO membership and LiveKit token issuance. Ticket creation is an account/invitation responsibility and is deliberately not exposed as an unauthenticated endpoint. This is an implemented foundation, not yet wired to the current private invite flow.

## v0.8.0 mode split — supersedes single-mode description below

Source navigation exposes GDrive separately from Screen share. For transport compatibility both use sourceType=screen, with shareMode=gdrive/interactive/view sent in sync and PeerJS call metadata. Default screenInteractive=false; toggle is a pre-capture setting, stop and re-share to change live mode.

GDrive routes through interactive-room.js quiet functions and background.js media control. Screen modes route through page-interaction.js; interactive-background.js + interactive.mjs implement capture-handle-bound fixed input via debugger. Runtime message namespaces and status bridges are isolated. Non-interactive calls getDisplayMedia without extension and sends no remote input. GDrive uses tabCapture and never attaches debugger. Explicit popup mode selects which path starts; existing other-mode link must be stopped/unlinked first. Source/room top-level navigation revokes interactive link.

Updated 2026-10-12.

## Room transport

Static browser app uses PeerJS connections for chat, playback messages, camera/mic and screen media. BroadcastChannel supplements same-context messages. Complete invite URL contains random room token and PeerJS host ID. Creator must remain online. No signaling or TURN service change in this update.

## Sources

YouTube is embedded; web video is a direct browser-playable URL; personal file uses WebTorrent and browser codecs; shared tab is a captured audio/video stream, not a copy of the media file or an iframe.

## Current extension v0.7.1

1. On Drive, presenter invokes extension toolbar action (normal activeTab grant).
2. Popup selects a connected Kindred room; worker verifies room readiness, origin, document and room token.
3. Worker discovers one visible HTML video only in allowed HTTPS frames. Foreign extension frames are skipped. Pin document + element ID.
4. tabCapture produces a stream ID restricted to recipient room tab. Content bridge forwards it; room consumes it with getUserMedia tab constraints.
5. Existing screen-call transport distributes audio/video to members.
6. Member control travels over data connection to current presenter, then bridge → worker → pinned mediaOperation.
7. Acknowledged media state is returned to member; polling refreshes source time/paused state. Pause never sets currentTime. Seeking is explicit/validated.
8. Stop/unlink/navigation revokes session. Capture is stopped. Pending/stale responses cannot restore prior state.

No debugger permission or commands; no getDisplayMedia for this feature. Only media controls, no arbitrary input. Token remains local to presenter; guest request has share epoch, action and optional seek time. Worker checks recipient tab/document/token. Room checks sender against open connection and current owner, limits request rate and pending count.

## Lifecycle

Actual source changes stop prior sharing. Incoming sync preserves already-arrived matching screen call rather than closing it (data/media can arrive in either order). Stale call events are ignored once that call is removed/replaced. Shared-video DOM node persists across render. Source audio is routed through capture, so presenter and guest use explicit Enable tab audio below chat.

## Constraints

Only supported visible HTML video in Drive/Docs/googleusercontent HTTPS frames can be controlled. Ambiguous/inaccessible/replaced players fail explicitly. DRM, site restrictions, closed shadow trees and unlisted origins may prevent control. Navigation requires re-sharing. Only desktop Chrome/Chromium presenter supported. No claim of production cross-network reliability from local tests.
