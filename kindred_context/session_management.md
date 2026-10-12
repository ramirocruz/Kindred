# Room session management

Implemented 2026-10-12 in `dist/room-session.js`.

Invite opens the room actions dialog with Leave room available even before connection readiness. Leave and Home stop camera/microphone, sharing and torrents, unlink extensions, destroy the peer and room BroadcastChannel, clear member/source/chat state and return home. This fixes the previous Home behavior, which left `peer` alive and caused subsequent `setupPeer` to skip connection setup.

Data-channel leave, close, error and WebRTC failed/closed states remove the member and associated media calls, streams and card. Handlers are bound to the exact connection so a stale close cannot remove a replacement. Peer callbacks are guarded against destroyed room sessions. `pagehide` performs teardown; returning through browser back/forward cache goes home.

Peers negotiate ping/pong support. Every ten seconds supported peers are checked; 150 seconds without data removes a silently lost connection. The generous timeout allows background timer throttling. Old clients without ping support rely on transport events. Backgrounding alone does not leave the room. A browser/OS crash cannot guarantee an immediate leave message.

A browser-profile BroadcastChannel lets the latest room entered take over from older open tabs, which leave and return home. This is local to a browser profile, not account-wide or cross-device. Opening the landing page alone does not evict an active room. All old tabs must load the updated site once to participate.

Verified in isolated Chromium using fixture PeerJS connections: member removal, replacement-connection safety, silent timeout, Leave action, creation after leaving, real cross-tab takeover and pagehide teardown. Existing layout/fullscreen tests and nine unit checks pass. These tests do not prove live two-device transport behavior.

Future suggestions: host handover (creator still anchors new invites), recent-room/rejoin list, and a visible reconnecting state with a short grace period. Not implemented in this change.
