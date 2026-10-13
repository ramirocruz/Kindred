# High-level design

For the complete documentation, open the [HLD guide](https://ramirocruz.github.io/Kindred/architecture/#hld), [LLD guide](https://ramirocruz.github.io/Kindred/architecture/#lld), [HLD diagram](https://ramirocruz.github.io/Kindred/architecture/hld.html), or [LLD diagram](https://ramirocruz.github.io/Kindred/architecture/lld.html). The guide describes each active component, contracts, end-to-end flows, security limits and pending verification.

Kindred is a static React/Vite app. Browsers—not an application backend—own the room.

## Room coordination

- The creator coordinates membership, admission order and replicated state.
- Members connect through PeerJS and exchange encrypted WebRTC data frames.
- If the coordinator leaves, the eldest reachable member claims the stable PeerServer room address before taking authority. Returning hosts join as regular members.
- The coordinator is not necessarily the presenter. Everyone can control playback; only the presenter can revoke its shared tab.
- The latest 100 encrypted messages remain in member memory. When everyone leaves, the room ends. This is not durable storage or arbitrary-partition consensus.

## Connection infrastructure

PeerJS public signaling and STUN/TURN defaults match the legacy app. They establish connections; they do not own application room state. Media/data travel directly where possible; TURN can relay encrypted traffic. Self-hosted endpoints remain optional.

TODO: decide hosting/privacy later. Public infrastructure sees connection metadata, and direct peers may see each other's IP. Invitation-key AES-GCM encrypts chat/control frames but does not provide forward secrecy or independent human identity verification.

## GDrive path

1. The presenter explicitly selects a Drive tab and Kindred room in the Chrome extension.
2. The extension pins a supported video element and document, issues a tab-capture stream ID, and keeps its private control token in the presenter browser.
3. Kindred acquires the captured audio/video and streams it over separate PeerJS screen calls. Camera/mic calls remain independent.
4. Guests send authenticated play/pause/seek requests directly to the presenter. The extension controls the actual Drive video and returns acknowledged state. The coordinator replicates public presentation state/epoch, never the extension token.
5. Navigation, tab closure, capture end or stop/unlink revoke the share. A departed presenter cannot pass its stream to the next host.

Source audio is suppressed during Chrome capture. Each member unmutes one Kindred player to hear movie audio. GDrive has no debugger attachment; interactive screen sharing is a separate pending migration.

## Status

Implemented: browser rooms, encrypted chat/reactions, host succession, camera/mic lifecycle, GDrive capture bridge and shared controls.

Verified: focused Jest coverage, production build, local room/chat browser checks, and GDrive setup UI. Actual authenticated Drive capture, remote audiovisual delivery, physical-device quality and TURN-only calls remain unverified. YouTube/web-video/personal-file and interactive screen-sharing adapters remain pending.

## Interactive diagram

Open the [hosted guide](https://ramirocruz.github.io/Kindred/architecture/) or [versioned guide HTML](architecture/index.html). New HLD/LLD candidates under `.archify/architecture-kindred-{hld,lld}-20261013-155600/` are pinned to runtime source `690b645`. Published diagram HTML is a user-approved documentation asset; validation receipts remain local. GitHub Actions explicitly copies guide/HLD/LLD/previous-overview HTML into the website's `architecture/` folder, excluding all other documents and receipts.

The older service/LiveKit diagram is historical, not the current runtime.

## Runtime update note

The pinned diagrams remain historical source snapshots. Current GDrive remediation adds negotiated playback-only deltas with sequence-gap recovery, single-path delivery, bounded asynchronous controls, unchanged-history suppression and requested 720p30 motion capture. See [current performance notes](../Context/performance.md); pinned HTML is not a live code specification.
