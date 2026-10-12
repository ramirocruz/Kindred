# Testing and regression evidence

## React migration foundation — 2026-10-12

Strict TypeScript checks passed in the React/Vite client and TypeScript room service. Jest passed four service cases (member upsert/removal, playback seek clamp, signed ticket validity/expiry/tamper rejection) and two web reducer cases (shared playback state, local-only camera toggle). Production builds passed; the React production entry is 227 KB / 71 KB gzip after Faker was changed to a development-only lazy mock. Browser preview confirmed the React shell renders three typed mock members and play state changes. No production deployment or LiveKit/two-device test has occurred.

## Camera controls placement — 2026-10-12

Isolated Chromium check passes: exactly two controls within local card, 30px button width, opacity zero at rest and visible on hover/keyboard focus. Existing browser-room-layout suite passes. UI-only relocation preserves existing media handlers; no new live camera test performed.

## Session lifecycle — 2026-10-12

`node tests/browser-room-session.cjs` passes membership removal, stale close safety, negotiated heartbeat timeout, leave/create again, cross-tab takeover and pagehide teardown in Chromium with fixture PeerJS connections. The fake clock is installed before page scripts so it controls the real heartbeat interval. Existing browser layout suite and nine unit regressions also pass. Actual two-device tab closure and crash recovery are not verified by fixtures.

## Local camera mirror — 2026-10-12

`tests/browser-room-layout.cjs` passed with generated video streams and asserts that the local `#localTile` preview has an x-axis mirror transform while a remote participant's video has no transform. This verifies display isolation in the room UI; it is not a live two-device camera call.

## Call sizing and dragging — 2026-10-12

Extended browser-room-layout.cjs to verify initial 4:3 cards, generated 16:9 video metadata sizing, divider drag shrinking movie, horizontal/vertical card movement, and preservation across render. Fullscreen/chat checks remain included. This is generated media and fixture participants, not a live two-member camera call.

## Media-first layout — 2026-10-12

`node tests/browser-room-layout.cjs` passed in isolated Chromium: vertical cards, enlarge state, collapsible bottom chat, real fullscreen across room rerender, controls hide/reveal and exit, narrow viewport overflow check. Screenshot inspected at /private/tmp/kindred-fullscreen-layout.png. Fixture participants only; no live camera or Drive session tested here. Syntax, diff checks and all nine existing unit tests passed.

## v0.8.0 regression — 2026-10-12

- node --test tests/*.test.mjs: 9 pass (quiet media/authorization/lifecycle plus restored interactive capture binding/input validation/letterbox mapping).
- tests/browser-interactive.cjs: passed real extension cross-origin click/drag/text/scroll; capture handle; guest RTC video+input; source player survives render; stop/unlink block input.
- tests/browser-quiet-sharing.cjs: passed updated youtube.googleapis.com fixture origin, synthetic foreign extension frame, actual toolbar-granted tabCapture, presenter/guest play/pause/seek, non-silent guest audio, unlink. A first run expired waiting for native action during a user interruption; repeated run passed.
- tests/browser-sharing-modes.cjs: passed five separate source segments, toggle warnings, no automatic prompt on source selection, default non-interactive, real capture without extension, hidden remote controls and stop. Initial headless-shell run timed out; full Chromium run passed.
- These remain isolated fixtures with local signaling. Not authenticated Drive, personal user extensions, production PeerJS signaling or two-device networking. Final debugger navigation cleanup is source-checked but not a full navigation browser regression.

Updated 2026-10-12.

## Player-control polish candidate — 2026-10-12

- `node --check dist/interactive-room.js` passed.
- Parsed the inline room script with Node's function parser; it passed.
- `node --test tests/*.test.mjs` passed: 9/9. These preserve GDrive media discovery, authorization, lifecycle, play/pause/seek, and interactive-screen regressions.
- Opened a local Kindred room in a browser preview and visually checked the new round play, ±10-second, and re-sync controls. The live GDrive seek rail and tab-audio button require a real shared-tab stream, so their render was source-inspected rather than live-captured in this preview.
- The update was not yet tested against an authenticated Drive tab or a two-member room. Its changed UI uses the existing `quietAction` and tab-capture paths rather than introducing a new playback path.

## GDrive audio-control placement follow-up — 2026-10-12

- Implemented, pending publication: `updateQuietUI` now inserts the existing tab-audio button immediately after `#togglePlayback` in the GDrive control row. It preserves the same event handler and mute state; no capture or playback protocol changed.

## Current production candidate v0.7.1

- Run node --test tests/interactive.test.mjs: **5 pass**. Covers media discovery, play/pause without zero reset, validated seeking, unavailable/replaced video, no debugger permission, wrong room/tab/document/token rejection, unlink revocation, matching incoming stream preservation, stale call isolation.
- Run node tests/browser-quiet-sharing.cjs with local Playwright (KINDRED_PLAYWRIGHT can override module path). Headful isolated Chrome requires native toolbar action on the test source → Kindred Tab Control → Share this tab; test waits up to 120s.
- **Passed browser run:** actual production extension and room, generated 6s WebM in cross-origin Docs-shaped iframe under Drive-shaped fixture, synthetic foreign-extension iframe kept present.
- Real tabCapture arrived in room; presenter controls play/pause/seek; pause kept 3s; NaN seek rejected.
- Guest separate browser context without extension received actual WebRTC video and non-silent audio (WebAudio analyser, not just track presence); guest play/pause/seek changed source; guest stop rejected.
- Native Chrome screenshot showed no large debugger or sharing-to-this-tab bars; small purple/source-tab capture indicators remained.
- Room presentation line below chat; player survives render; timeline exists; header unlink revokes session/capture and guest control.
- Final lifecycle preservation changes were additionally unit-tested after browser run. Integration fixture manually exchanges signaling, not production PeerJS server; does not exercise real call ordering.
- Screenshots in temporary directory: kindred-production-room.png, kindred-production-guest.png.

## Required real-world check / unverified

1. Replace extension files with v0.7.1; Reload, accept permissions, refresh Kindred; disable separate prototype extension.
2. Two members on separate devices/networks join complete private invite.
3. Presenter opens authenticated Drive media, starts once, extension toolbar chooses exact room → Share this tab.
4. Verify guest sees video; enable tab audio on both and listen for quality/echo.
5. Both use room play/pause/timeline/±10s; confirm actual Drive source changes without jumping to zero.
6. Keep other normal extensions enabled; verify actual player discovery (fixture only proves foreign frame is skipped).
7. Unlink in room and extension, navigate source, close source, leave/rejoin room; stale controls must fail.
8. Check changing to personal/web/YouTube stops prior screen share; camera/mic regressions separately.
9. Check stable Chrome indicator appearance. Compact browser security indicators are expected and not suppressible by app.

Do not label fixture results “authenticated Drive works” or “two-device networking tested.” Audio measurement proves non-silent received data, not speaker quality. Former tests/browser-interactive.cjs and debugger files were removed, recoverable from Git; they describe superseded v0.6.0 behavior, not current tests.

## Prototype/history

See quiet_tab_prototype.md. Historical v0.6.0 full-page debugger test passed cross-origin click/drag/typing; a second extension frame separately reproduced Chrome's Cannot access a chrome-extension URL error. That limitation motivated current frame-filtered media mode. Current tests do not certify every third-party extension.
