# Playback diagnosis — 2026-10-11

## Audio report after v0.8.0 — 2026-10-12

User reports GDrive video works but room and original Drive tab are silent. Chrome tabCapture docs confirm original-tab local audio is suppressed during capture; listening must be routed through the captured stream. Source inspection confirms GDrive starts sharedScreenAudio=false and exposes Enable tab audio below chat for each participant. This is a plausible immediate cause, not confirmed for the reported session.

Read-only inspection of the available in-app room later in this turn showed **Interactive tab**, not GDrive, with Audio enabled; displayed video muted=false, paused=false, readyState=4. Audio-track/signal data was not obtainable from this inspection. Do not infer that this proves audible sound or diagnoses the earlier GDrive session. No source changes or deployment this turn. Next check: enable audio in the GDrive room on each member; if still silent, inspect captured audio signal/track on presenter versus guest.

Reference: https://developer.chrome.com/docs/extensions/reference/api/tabCapture#preserve-system-audio

## Confirmed v0.7.1 actual Drive detection gap — 2026-10-12

User screenshot shows v0.7.1 popup returning No accessible video found. Read-only inspection of the user's existing authenticated Drive tab found the actual visible HTML video inside an iframe on **https://youtube.googleapis.com/embed/**. Video readyState=4, visible rect 714×533, finite duration ~3863.45s. No playback actions, file downloads or permission changes were performed.

Current background sourceAllowed filter accepts only drive.google.com, docs.google.com and *.googleusercontent.com; manifest host_permissions omits youtube.googleapis.com too. Thus discovery skips the observed real player frame before mediaOperation can inspect it. This is a confirmed implementation gap, not evidence of MKV decoding failure or a macOS recording-permission issue.

Required repair: separate permitted top-level source origins from permitted player-frame origins; narrowly add observed youtube.googleapis.com HTTPS player origin and corresponding extension permission, preserving foreign-extension-frame exclusion. Update regression fixture to this actual origin and test discovery/controls. Actual end-to-end Drive control is still unverified. This diagnostic turn changed context only, not application code or deployment.

Previous Docs-shaped fixture passed but did not reproduce the real Drive player's origin. Do not represent that fixture as real Drive validation. Do not store signed iframe query parameters or media URLs in context.

## New v0.6.0 linking diagnosis: foreign-extension frame

Reported error: `Cannot access a chrome-extension:// URL of different extension` on an HTTPS Google Drive tab. A tab's top-level URL does not identify every embedded frame's origin.

**Verified:** ran the actual unpacked Kindred extension in isolated real Chromium with an additional minimal test extension exposing an HTML iframe. A route-intercepted HTTPS Drive fixture linked successfully with no foreign frame; adding the test extension's `chrome-extension://.../frame.html` caused Kindred's link operation to return the exact reported error; removing only the synthetic fixture frame restored linking. Test exited successfully. No personal Chrome profile or authenticated Drive files were accessed. Regression harness: `/private/tmp/kindred-foreign-frame-regression/test.cjs` (temporary diagnostic artifact, not part of the deployed source).

**Hypothesis for the user's actual tab:** another extension has injected a frame into Drive. We have not inspected that tab's frame tree or identified a responsible extension. Earlier tests used only Kindred and ordinary cross-origin HTTPS frames, so they did not cover this collision.

**Next action:** compare in a fresh Chrome profile with only Kindred installed, or temporarily disable other Drive-enabled extensions and reload the source tab. If confirmed, narrow down by re-enabling one at a time. Do not remove real page frames automatically, disable Chrome security, or describe more recording permissions as a fix. No application change/publication in this diagnostic turn.

Related Chromium discussion: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/01_kmDMua2w . Local reproduction, rather than that discussion alone, is the evidence above.

## Historical v0.5.0 diagnosis

Historical analysis of v0.5.0. The subsequent v0.6.0 implementation replaces this screen-share command path with captured-page browser input; see `interactive_sharing.md` and `testing.md`. Keep this diagnosis as evidence of the earlier failures, not as the current architecture.

Scope: read the five context documents and current deployed-source scripts; run isolated Node VM diagnostics against the actual controller and bridge scripts. This turn changes documentation only. No application fixes or deployment were performed.

## Reproduced with the actual scripts and simulated browser objects

- A video at 120 seconds receives `{action:'pause', time:0}` and moves to 0 seconds. The page still includes `presenterPlayback?.time || 0` in screen play/pause and re-sync commands; the controller applies `time` before handling the action. Removing absolute time from relative seeks did not fix this separate path.
- A playable video with `disablePictureInPicture=true` is excluded by `bestVideo()`, returning `No playable video was found in this tab.` The flag is not a playback capability check. This exclusion was introduced in v0.4.0. Whether the user's actual player sets it is unknown.
- The bridge drops a controller failure returned as `{connected:true, ok:false, control:{ok:false, message:...}}`. It only forwards command responses when `connected === false`. Thus the room can appear linked while every command fails silently.
- Control case: a plain simulated video at 120 seconds accepts `{action:'seek', delta:10}` and moves to 130 seconds. This proves only that the isolated relative-time arithmetic works, not that real tab selection or delivery works.

## Additional code findings

- `background.js` marks a tab linked after script injection and tab lookup, without checking whether any video was found. The title update proves status delivery, not player readiness.
- `controller.js` searches `document.querySelectorAll('video')`; injection targets the main frame only. A player inside an iframe or shadow root is not discovered by that search. The current Google Drive page structure has not been inspected, so this remains a candidate explanation for this user's failure.
- `mountScreenShare()` sets the shared room `playing` state from the screen-stream preview's play/pause events. A live screen stream can keep playing while the actual movie is paused. These are different states and must not drive the same button.
- Controller-triggered playback events are suppressed for 500 ms, while command results are discarded. This prevents reliable confirmation of the actual resulting timestamp and paused state.
- The earlier bridge sent command responses without a title as `bridge-status`; the page compared that empty title with its stored title and called `render()`. Rendering replaces the whole app DOM, including the video elements. The v0.4 change removed this specific trigger, but unrelated status/chat/profile changes still rebuild the player. The refresh symptom should not be declared fully resolved.
- Unlink clears the saved tab ID, but injected controllers remain installed and the background forwards controller events without checking `sender.tab.id` against the linked tab. Old tabs can still emit state. The persistent dialog's unlink listener is also added on every room bind, so repeated renders can accumulate listeners.

## What is not established

- Which exact video element/frame is present in the user's source tab, which extension files their installed copy contains, and whether a command reaches that video.
- The cause of the guest's previous blank screen. Screen-stream receipt, autoplay, connection state, and element replacement need separate observation. Tab linking and macOS recording permissions do not establish guest video delivery.
- No evidence currently establishes DRM as the cause.

## Recommended repair and verification order

1. Carry command IDs and success/error results through the full guest → presenter → extension → player path. Display actual failure reasons and report resulting time/paused state.
2. Confirm the selected tab contains a controllable video, including its frame, before showing readiness. Inspect the actual source page before requesting any additional permissions.
3. Make play/pause change only paused state; make seeks alone change time. Remove the picture-in-picture exclusion. Keep captured-stream status separate from source playback state.
4. Preserve player elements during room UI updates and verify unlink also rejects events from the old tab.
5. Test real Chrome playback locally first, then guest-issued commands, then the user's source site. Report each layer's results separately.

The previous iteration process patched plausible symptoms after syntax checks, without establishing command delivery and real player behavior. This explains why deployment success repeatedly failed to predict functional success.
