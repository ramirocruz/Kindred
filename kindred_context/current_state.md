# Current state

## React migration — 2026-10-12

Foundation complete, not deployed: parallel React/Vite/TypeScript client and TypeScript room service. The web preview uses a development-only Faker mock module; its production entry excludes Faker. The service has typed room state, Socket.IO lifecycle boundaries and signed-ticket requirements before it will issue a LiveKit token or accept room membership. Production still serves the static `dist/` version 29. The migration avoids replacing the existing watch room until room state, calls, source handling and session flows have feature parity. Local `Context/` migration notes are intentionally ignored; source architecture notes remain here.

Verified locally: strict TypeScript in both workspaces; four room-service Jest tests; two web reducer Jest tests; both production builds. Not verified: a LiveKit connection, authenticated ticket issuance, deployed room service or two-device media call. Select LiveKit Cloud or self-hosting and configure the service environment before Phase 1.

## Camera card controls — 2026-10-12

Published version 29, source `23c20b522a2545e2797b09339f1be95af55d59cb`, deployment `appgdep_6accbeef0e7881918bb9a74a961aa020` succeeded 2026-10-12T11:05:39Z. This receipt supersedes the pending label below and is retained locally for next source save.

Camera/microphone controls now sit inside the local card at bottom-left. Buttons are 30px with 17px icons, hidden until card hover or keyboard focus; touch/coarse-pointer devices keep them visible. Existing button nodes/handlers are retained and remote cards have no local controls. Browser checks verify placement, size and hover/focus visibility; existing layout/fullscreen suite passes. Publication pending.

## Session management — 2026-10-12

Published version 28, source `789464f5ba9ecbbacca16b05a6260d020126ffc0`; deployment `appgdep_6accbc4f3eb48191b30d8ccc2dda7966` succeeded at 2026-10-12T10:54:26Z. Leave room in Invite, complete session teardown, participant close/failure/heartbeat cleanup, and latest-room takeover across tabs in the same browser profile. See [session_management.md](session_management.md) for behavior and verification limits. Browser session/layout suites and nine unit regressions pass. Creator handover remains a future feature. Deployment receipt retained locally for the next source save.

## Local camera mirror — 2026-10-12

Published version 26: source `cdfe035ff265416f1b35a915dedc9d065c7f76fd`, deployment `appgdep_6accb6a072048191be715a91560005a8` succeeded at 2026-10-12T10:30:12Z. Only the local `#localTile` preview is mirrored with a CSS display transform. It does not alter the camera `MediaStream` sent through PeerJS, so other room members keep seeing the normal, non-mirrored camera image.

## Call card geometry and resizing — 2026-10-12

Published version 25: source `aa73aad5a75c798e6d4e376647a8523880d0a63a`, deployment `appgdep_6accb3301808819192139b98dde720bf` succeeded at 2026-10-12T10:15:29Z. Browser tests passed including generated-video aspect ratio. Receipt retained locally for next save.

Cards now use actual camera videoWidth/videoHeight (4:3 until available) rather than stretching to fill the column. Metadata and video resize events update proportions. Cards can be dragged horizontally and vertically inside the call area; positions are clamped and retained across room renders. Divider drag or arrow keys changes call-section width, shrinking/growing the movie in normal and fullscreen layouts. Default cards leave some horizontal room for positioning; enlarge fills the column while preserving aspect ratio. Preferences are local to this open page. Browser verification covers ratio, dragging, retained positions, divider, fullscreen and chat.

## Media-first room layout — 2026-10-12

Published as version 24, source `22a82a9fbb15321c9a737e5383d50bc6219e57f4`; deployment `appgdep_6accb0c726d881919d9f001683ab1873` succeeded at 2026-10-12T10:05:14Z. Custom audience preserved. Receipt is a local update for the next source save.

Implemented: wider player, vertical adaptive call cards with per-card enlarge/restore buttons, bottom-right chat collapsed by default with new-message count, and native fullscreen with the call column retained. Fullscreen uses the document root so ordinary room rerenders do not exit fullscreen. Controls hide after inactivity and reveal on pointer movement, bottom hover, keyboard focus, or touch. Local presentation preferences persist across renders. Module: room-layout.js and room-layout.css.

Verified in isolated Chromium: vertical arrangement, card enlargement, chat open/close, actual Fullscreen API entry and exit, fullscreen survival across render, control hiding/reveal, and no horizontal overflow at 600px. Nine existing unit regressions pass. Browser fixtures do not establish live call quality or actual Drive playback. Publication receipt follows after deployment.

## Current update — separate GDrive and Screen share (v0.8.0 released)

Publication confirmed: site **version 21**, source `a2ae0842e201aafc001ce05f0df15f26ef3c8502`, extension **0.8.0**. Deployment `appgdep_6acc8188514881918e80d1729b6af698` returned succeeded at 2026-10-12T06:43:35Z. Audience unchanged. Receipt is a post-publication local context update for the next source save; version 20 notes below are historical.

User requested a dedicated GDrive source plus restored interactive/non-interactive Screen share. Implementation now has five source segments. Screen share defaults to non-interactive (no extension). Interactive mode uses the restored debugger/capture-handle path and visibly warns of Chrome's debugger notice. GDrive keeps tabCapture/media-only controls and adds the observed youtube.googleapis.com player-frame permission/filter. Extension v0.8.0 bundles both modes; debugger is attached only after explicitly linking Interactive screen. Existing personal/YouTube/web sources retained.

Verified this turn: nine unit tests; restored real-browser interactive click/drag/type/capture/guest relay test; GDrive real capture/guest video/non-silent audio/play/pause/seek on youtube.googleapis.com-shaped fixture with foreign-extension frame. Tests use local signaling and generated fixtures, not authenticated Drive or different-device networks. Non-interactive test outcome recorded in testing.md. Historical descriptions below apply to v0.7.1; this section supersedes their single-mode scope. Publishing receipt pending.

Updated: 2026-10-12

## Player-control polish candidate — 2026-10-12

Implemented, pending publication: the GDrive control strip now places its seek rail above the playback row, with elapsed/total time and a progress-coloured thumb. The lower row uses compact circular media controls; the central control renders as a real play/pause icon rather than a labelled generic button. The shared-tab audio action below chat is now the same circular loudspeaker treatment as the camera and microphone controls, including a slash when muted. This is a visual and accessibility update only: it does not alter capture, audio routing, room permissions, or the GDrive command protocol.

Publication confirmed: site **version 22**, source `c72c040352e4248cd406a6eda2f9f2de114512c3`, deployment `appgdep_6acc9998f30c81918a07fbcee3336acb` succeeded at 2026-10-12T08:26:15Z. This receipt is a local context update for the next source save; access remains custom/private.

Follow-up implemented, pending publication: in GDrive mode the tab-audio speaker now sits directly after play/pause in the player control row, rather than below the chat. It retains the same enabled/muted state, accessible label and slash icon; only its placement changes.

Publication confirmed: site **version 23**, source `08f6bb183499a63e4ba0a81125f8939585da433d`, deployment `appgdep_6acc9c739bec8191b0721dccef0178e5` succeeded at 2026-10-12T08:38:25Z. This receipt is a local context update for the next source save; access remains custom/private.

## Publication

- URL: https://kindred.cheekyscout32.chatgpt.site
- Latest confirmed deployment: **version 20**, source `fdc578d18be2aa6570fc889ec3012d9c4f301817`, extension **0.7.1**. Native deploy returned succeeded on 2026-10-12 local time (2026-10-11T19:11:26Z).
- Deployment receipt: `appgdep_6acbdf47262c819194a0c7fe60f37ac5`; saved version `appgprj_6acb308c0ab081918391c2b131a35756~appgver_17149e6dc4d081918335c590380d03f2`. These post-publication receipt lines are local context updates for the next source save.
- Preserve private/custom audience: Raman and invited viewer sonianchal512@gmail.com.
- Old extension 0.6.0 must be replaced/reloaded; refreshing the website alone does not update an unpacked extension.

## Current design

Playback-only shared-tab controls, no unrestricted mouse/keyboard remote control. User accepted this trade-off after the separate Quiet Tab prototype. See interactive_sharing.md and architecture.md. Personal file, YouTube, web video and calls remain separate features.

The presenter starts sharing from the extension toolbar on the source tab, choosing the exact Kindred room. Everyone can play/pause/seek using room controls. Guests need no extension. Presenter and guests enable tab audio below chat. Unlink is available in extension and room.

## Verified locally

- Production extension + production room passed browser integration with a real seekable generated WebM, a cross-origin player frame, and a foreign-extension frame.
- Presenter and guest play/pause/seek affected source video. Pause preserved timestamp; invalid seek rejected. Guest has no extension and receives actual WebRTC video plus non-silent audio (analyser measurement).
- Room unlink cleared capture/session and prevented further guest control.
- Player survives routine render; presentation status is below chat; room timeline is visible.
- Native Chrome for Testing 151 on macOS showed neither large debugger nor sharing-to-this-tab bar. Compact purple capture and source-tab indicators remained.
- Five unit tests pass, including room/tab/document/token authorization and preserving matching incoming screen calls when sync arrives after media.

## Not verified / limits

- **Confirmed user blocker (2026-10-12):** real Drive preview embeds its visible video on youtube.googleapis.com, which v0.7.1 excludes from both frame discovery and extension permissions. Read-only DOM inspection confirms ready media there. No application fix deployed yet; see playback_diagnosis.md.

- Real authenticated Google Drive playback with the user's specific other extensions.
- Different-device/network traversal or production PeerJS signaling: browser fixture exchanges signaling locally.
- Stable Chrome's exact indicator UI; no guarantee that every browser capture indicator disappears.
- Audible speaker quality/echo: test proves non-silent received tab audio, not listening quality.
- Camera/microphone, personal-file streaming and YouTube end-to-end behavior were not retested in this task.
- Restricted/ambiguous/unsupported media fails explicitly; no guarantee all Drive players work.

See testing.md for reproduction and quiet_tab_prototype.md for prototype history.
