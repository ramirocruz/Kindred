# Debugger-free Quiet Tab prototype — 2026-10-12

## Production promotion — 2026-10-12

User requested “lets update kindred.” Prototype design is now integrated into the production candidate as extension **0.7.1**. This document below preserves prototype evidence, not current release status; see current_state.md and testing.md. Production fixture now verifies non-silent guest audio and room integration, bounded/rate-limited commands, explicit room/document authorization, lifecycle revocation and unlink. Actual authenticated Drive, stable Chrome and two-device networks remain unverified. Do not load the prototype alongside the production extension.

## Historical prototype status

User accepted a prototype of playback-only controls plus extension tabCapture, trading away unrestricted page interaction. Implemented under `prototypes/quiet-tab/`, outside `dist/`. **Not published or integrated into live Kindred.** Live version 19 and extension 0.6.0 remain unchanged. Local prototype extension version 0.7.0 is not a production release.

## Verified evidence

- Two native-action Chromium test runs completed successfully. Latest: `KINDRED_NATIVE_TEST=1 node prototypes/quiet-tab/test.cjs`, exit 0.
- Test created a real six-second seekable WebM in a cross-origin Docs-shaped player inside a Drive-shaped fixture. A synthetic foreign extension iframe remained present throughout linking/control/capture.
- Actual Chrome extension-menu action was invoked via native UI, then Share this tab clicked. This grants activeTab normally. Programmatically opening the popup alone did not grant capture: Chrome correctly rejected that initial attempt. No permission-bypass flags were used.
- Real tabCapture stream arrived at the local prototype page. Extension has no debugger permission/calls and no getDisplayMedia call.
- Native Chrome UI screenshot while actively capturing showed **neither large debugging bar nor large sharing-to-this-tab bar**. A compact purple capture indicator and source-tab sharing icon remained. This is evidence for tested Chrome for Testing 151 on macOS, not a promise for every Chrome version/platform.
- Play/pause/seek affected the actual source video in its cross-origin frame. Pause preserved a 3-second position. Nonfinite seek rejected. Presenter stop cleared stream and extension session.
- Separate browser context without extension received the captured stream through real WebRTC and could play/pause/seek through a real data channel to the presenter. Guest stop/unlink denied (only playback controls granted). Test signaling is local, not production PeerJS or across networks.
- Main test screenshot: `/var/folders/zx/jjq7yg8x4w721m2y36rx929w0000gn/T/kindred-quiet-prototype.png` (page only). Browser-chrome screenshot was inspected using native UI, not this file.

## Design

Selected recipient is a local room at `http://localhost:4178`. One-use capture stream ID is restricted to that tab. A per-share token plus recipient tab ID gates media commands. The selected media element is pinned to its browser document ID. Navigation and stop revoke authorization. Allowed source origins: Drive, Docs, googleusercontent. Foreign-extension frames are skipped, never deleted. Ambiguous or inaccessible video selection fails rather than silently choosing a player. Only play, pause, seek and state are supported; arbitrary native clicks are intentionally absent.

## Remaining release gates

1. Test the **actual authenticated Google Drive app**, with the user's other extensions enabled: source media discovery/frame origins, seeking and audio. Tests so far use fixture pages, not Drive implementation. Protected players/closed shadow roots/unlisted origins may require a supported adapter or remain unsupported.
2. Verify audible tab audio reaches presenter and guest, no feedback/duplication, and autoplay recovery. Synthetic test video was silent; an audio track existing is not proof of audible delivery.
3. Integrate with production room source lifecycle, participant admission and PeerJS signaling; validate two-device/network behavior and existing webcam/personal/YouTube/web tabs without regression.
4. Add bounded guest-command rate limits, reconnect handling and fuller navigation/relocation tests before production. Prototype currently proves core flow, not production hardening.
5. Recheck normal stable Chrome indicators and permissions before release. No promises that all browser capture indicators disappear.

Local setup instructions: `prototypes/quiet-tab/README.md`. Run its `server.cjs` and load its separate `extension/` folder in Chrome to try actual Drive. Do not replace the existing live extension before these gates pass.
