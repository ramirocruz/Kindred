# Shared-tab playback — production extension v0.7.1

## v0.8.0 — current requested design

The user now requests BOTH options, not a universal playback-only replacement. GDrive has its own source tab and media-only controls. Screen share offers Interactive control OFF/ON (default OFF). ON restores everyone's click/drag/scroll/type inside the captured linked tab. Only presenter needs extension; browser/OS dialogs remain local. Stop and re-share to change mode.

Chrome debugger notice appears only after explicit Interactive screen linking. Ordinary getDisplayMedia may show its own sharing indicators. The original implementation lacked debugger, so no debugger notice; the supplied old screenshot is cropped below browser toolbar and cannot prove all capture indicators were absent.

Known foreign-extension-frame debugger conflict remains in interactive mode. GDrive skips foreign frames and includes youtube.googleapis.com based on real read-only Drive inspection. Actual authenticated Drive control is still not end-to-end proven. UI warnings and setup guide state these limits.

Updated 2026-10-12. Supersedes v0.6.0 debugger/full-page interaction. User accepted playback-only trade-off to avoid the large Chrome debugger/capture bars and then requested production integration.

## Scope

Everyone in the private room may play, pause and seek the shared source video. Only the person sharing needs the extension. Initial target is Google Drive. Arbitrary page clicks, typing, scrolling and zoom are not supported in this mode. Personal file, YouTube and web video remain independent source tabs.

## Design and permissions

Extension uses tabCapture after a real toolbar action (activeTab), not debugger or getDisplayMedia. The popup chooses the destination Kindred room. Capture stream ID is restricted to that room tab. Its content bridge acquires audio/video and uses existing PeerJS screen-call transport.

Discovery inspects only supported HTTPS Drive/Docs/googleusercontent frames individually, skipping foreign-extension frames without touching them. Exactly one visible HTML video is required. Its document and element ID are pinned. Commands are limited to state/play/pause/seek; pause never assigns currentTime. Seek validates finite target, duration and seekable ranges, and acknowledges seeked or an explicit failure. No zero-time fallback.

Authorization binds the source, recipient tab ID + document ID, room token and random per-share secret. Secret stays in presenter browser. Guest requests use a public share epoch and authenticated connection identity; bounded pending queue/rate limit, acknowledgements and timeouts prevent silent success. Navigation, room change, tab close, capture stop or unlink revoke. Stale results cannot update a new source.

## UX

Start on source tab: extension → choose room → Share this tab. Room exposes play/pause, ±10s and timeline. Sharing status/audio enable is a small line below chat. Video element persists across renders. Unlink available in room's linked-tab header dialog and extension. Only playback—not unlink—is delegated to guests.

Two large Chrome bars were absent in tested Chrome for Testing 151/macOS. Compact indicators remain browser-owned. No security flags or suppression of browser warnings are used.

## Evidence and remaining uncertainty

Five unit tests and tests/browser-quiet-sharing.cjs passed. Real capture/media/guest WebRTC audio/video verified using generated fixture pages; not the real Drive application or production signaling across networks. See testing.md. Historical debugger controller and its obsolete browser test were removed from current files; recoverable in Git history.
