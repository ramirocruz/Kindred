# Legacy lessons — not React verification

Legacy source: ../couch-club-watch-party/dist/. Dates 2026-10-11–12. Do not modify that project without explicit scope. Current React behavior: [GDrive](../gdrive.md), [UI](../ui-parity.md), [tests](../testing.md).

## Playback failure patterns

Old v0.5 diagnostics reproduced pause carrying a zero timestamp and controller assigning time before action. Picture-in-picture-disabled videos were incorrectly excluded. Nested command errors were dropped; linked title did not prove player readiness. Main-frame-only discovery missed embedded media; live capture preview playback is not actual source playback.

Whole-page re-render could replace the video and look like F5. Unlink could leave stale controller events/listeners. Lessons: stable video nodes, explicit play/pause versus seek, pin source/frame/document, request IDs/acknowledgements, validate stale callbacks, surface failures. Fixture arithmetic alone never proves source-site command delivery.

## Foreign extension / real Drive frame

An isolated synthetic foreign-extension iframe reproduced the cross-extension debugger error in v0.6; disabling its frame removed fixture failure. Actual responsible extension was not identified. Do not remove other extensions' DOM, bypass browser security or infer more recording permission solves it.

Read-only authenticated Drive inspection found visible media inside youtube.googleapis.com/embed. v0.7.1 origin filtering/manifest skipped that frame. A Docs-shaped fixture had missed the real origin; narrowly adding observed player permission fixed the known discovery gap in later builds. Never retain signed iframe/media URLs.

## Quiet capture / mode split

Quiet Tab v0.7 prototype used toolbar activeTab + tabCapture rather than debugger/getDisplayMedia. Real native toolbar action was required; programmatic popup alone did not grant capture. Cross-origin generated WebM and synthetic foreign frames verified local source control and actual guest WebRTC capture; later production fixture measured non-silent guest audio. These were fixtures with local signaling, not real Drive/two-device networks or audible quality tests.

Chrome for Testing 151/macOS lacked the two large bars in this capture path but retained compact capture indicators. That does not promise identical stable Chrome UI. Captured source audio is suppressed; enable one room speaker output. Audio track existence is not audible-signal proof.

User restored dedicated GDrive plus Screen share interactive/non-interactive modes in legacy v0.8.0. Interactive debugger/capture-handle input had click/drag/scroll/type fixture tests and debugger warning; non-interactive getDisplayMedia delegated no input. Only presenter needed extension. Full interactive React migration remains pending.

## Layout and lifecycle

Legacy source refs: 22a82a9 media-first vertical cards/fullscreen/chat; aa73aad aspect-ratio cards, bounded drag/divider; cdfe035 local mirror; 789464f room teardown; 23c20b5 small local hover controls.

Local camera display transform leaves outgoing tracks unchanged. Card size follows video dimensions; overlay controls appear on hover/focus/touch. Chat docks compactly; fullscreen retains cards and hidden/revealed controls.

Legacy teardown stopped camera/mic/capture/torrents/peers/BroadcastChannel. Exact-connection guards prevented stale closure removing replacement. pagehide cannot guarantee immediate notification; supported heartbeat timeouts complemented transport close. Browser-profile BroadcastChannel latest-room takeover was local, not account/cross-device behavior. Do not claim this entire legacy mechanism exists in React.

## Product constraints retained

Everyone may choose sources/control compatible playback; only presenter revokes own share. Personal files have their own tab, not the screen-share scope. DRM, autoplay, codec/site permission limits remain. Early personal-file buffering/blank guest reports were not proven fixed by syntax checks or deployment. Diagnose discovery, commands, capture, delivery and rendering separately.
