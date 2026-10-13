# Current Kindred

Updated 2026-10-13. Baseline evidence revision: `ff2a75c`; current performance remediation described below. Legacy app remains separate and unchanged.

## Implemented

- Static React + Vite + strict TypeScript; Tailwind/existing CSS preserve legacy design.
- Browser-owned TypeScript room coordination with PeerJS/WebRTC. No application room service, Socket.IO, LiveKit or Firebase runtime.
- Creator initially coordinates; eldest reachable admitted member succeeds after acquiring the stable alias. Returning creator is a regular member.
- Invite-key encrypted admission, data frames and chat; latest 100 encrypted messages replicate in browser memory.
- Everyone can control compatible playback; coordinator and presenter are distinct roles.
- Camera/microphone call lifecycle, devices initially off, local-only mirror and one incoming audio renderer.
- GDrive extension v0.9.2: debugger-free tab capture, pinned source player, authenticated guest playback controls and presenter-only unlink.
- Performance remediation: compact revision-checked playback deltas, single delivery path, non-blocking bounded control dispatch, unchanged-history suppression and requested 720p30 motion capture. Real Drive stutter resolution unverified.
- Custom room name and short UUID code appear in extension picker/header; tab title follows room name and resets on leave.
- Resizable movie/sidebar divider, compact translucent bottom chat, animated reactions, fullscreen retaining participants.

## Verified scope

73 Jest tests, strict typecheck and Pages build pass locally after performance remediation. First CI test run failed; deployment remains pending retry. Local browser tests cover room/chat and ordinary host succession. GDrive controls/profile have fixture coverage, not real Drive audiovisual/performance proof. See [testing](testing.md).

## Public deployment

[App](https://ramirocruz.github.io/Kindred/) and [HLD/LLD](https://ramirocruz.github.io/Kindred/architecture/) are published by repository Actions. GDrive v0.9.2 download is live. This is a separately approved migration deployment, not replacement of the legacy ChatGPT-hosted site.

## Pending priorities

1. Diagnose reported GDrive guest/control lag versus legacy with live stats and A/B tests; confirmed code inefficiencies and unknown media bottleneck are in [performance](performance.md). Two-device media verification remains required.
2. Actual camera/microphone quality, difficult networks/TURN, cleanup and background timer tests.
3. YouTube, web-video, personal-file and interactive screen-sharing adapters; their working migration is not yet implemented.
4. Participant dragging and remaining source-backed UI parity.
5. Decide signaling/ICE hosting/privacy; public PeerJS defaults are temporarily user-approved. Production security/revocation/partition review remains open.

Room state is ephemeral; all members leaving ends it. Browser capture indicators cannot be hidden. No production-readiness, zero-leakage or audited-E2EE claim.
