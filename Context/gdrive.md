# GDrive integration

Updated 2026-10-13. Extension v0.9.2; source `extensions/gdrive/`. React bridge/transport: `gdrive-bridge.ts`, `peer-screen.ts`, `GDrivePlayer.tsx`.

## Implemented flow

1. Presenter starts Drive video, invokes extension toolbar and selects a room by custom name plus short UUID code.
2. Worker verifies supported source/room origin and pins exactly one accessible visible video, frame and document.
3. Chrome tabCapture produces stream ID restricted to room consumer. Local bridge acquires audio/video.
4. Coordinator commits public presentation epoch/state; PeerScreen sends movie stream independently of camera/mic call participation.
5. Any authenticated guest sends play/pause/seek to presenter. Bridge/worker validates tab/document/token and operates on pinned source.
6. Request/owner/epoch checks and acknowledgements return actual playback state; polling refreshes state every 1.5 seconds.
7. Stop/unlink/navigation/close revoke local capture capability and stale results.

Token stays local, never in peer presentation snapshots. Pause never sets time; seek validates finite target/duration/seekable ranges. Foreign-extension frames are skipped; allowed player origins include observed `youtube.googleapis.com` frames. No debugger, arbitrary clicks or fully interactive iframe.

## UI / setup

Seek rail above play row; speaker beside play/pause; fullscreen keeps participants. Only presenter unlinks. Room name/title and code match picker/header; names do not replace security UUID/key.

Chrome silences original source-tab audio during capture. Enable Kindred's movie speaker on each member; avoid duplicate rendering. Browser-owned capture indicators remain.

Run `npm run package:extension` after source edits. Reload updated extension and refresh open rooms. Supported: localhost/127.0.0.1:5173 and Pages Kindred subpath. Legacy invitation format unsupported.

## Diagnosis / verification

User screenshot: “Receiving end does not exist” indicates no receiving content bridge at message time; refresh after extension reload is a next check, not a proven root-cause fix. Actual installed extension/capture was not inspected in that task.

Tests cover helper labels, encrypted simulated guest→presenter controls, source pause/seek, cancellation/epochs and media cleanup. Real authenticated Drive guest audio/video remains unverified. See [testing](testing.md), [legacy lessons](archive/legacy-lessons.md).
