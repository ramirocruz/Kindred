# Migration history — historical only

Period: 2026-10-12–13. Current facts: [current](../current.md). None of these old choices is an instruction to restore retired code.

## Foundation and UI

Initial migration proposed React/Vite/TypeScript + Socket.IO room service + LiveKit. Commits ba3f545/244feef/1f7023e added workspace, service/state and preview. User required a separate Kindred folder, leaving legacy untouched; accidental migration work was removed from the legacy project. Consolidation replaced two context folders with one.

Mock preview initially differed from legacy. User required source-first migration, not redesign. Landing/dialogs, divider, original setup guides, chat typing, translucent surfaces and finite reactions were restored incrementally; 4790f4b records chat/protocol correction. Eight→17 tests and local UI/mobile/fullscreen checks established limited interface behavior, not working shared media.

## Retired service stage

Fastify/Socket.IO session/chat used signed tickets, bounded ephemeral invites/history and optional LiveKit tokens; 21→25 tests plus local transport/configuration-error UI checks. No actual LiveKit media session was verified. Encrypted chat later used browser Web Crypto and ciphertext-only service envelopes; macOS checks reached 44 tests plus local message/history/wrong-key tests. Earlier Linux dependency/native-binding build failures were superseded by successful macOS validation, not persistent runtime defects.

## Browser authority and privacy choices

User then rejected room-service authority: browser creator coordinates, eldest reachable member succeeds, returning creator ordinary. The supplied architecture discussion clarified infrastructure options; direct user choices prevailed. 54bab2c removed tracked service/Socket.IO/LiveKit and implemented encrypted mesh/admission/alias acquisition. Browser tests verified normal successive handovers and sole-survivor recovery, not arbitrary partition consistency.

Self-host-only signaling/ICE was initially requested. User later explicitly chose legacy public PeerJS defaults; 589a591 supersedes that restriction. Self-hosting remains optional, hosting/privacy decision TODO. No Firebase selected. Encryption primitives do not solve human identity, forward secrecy or revocation.

## GDrive and docs/deployment

b3e9e8b migrated legacy debugger-free capture, pinned media operations, encrypted guest control and independent screen calls. Automated tests grew to 58; actual authenticated Drive AV remained unverified.

Architecture first described service/LiveKit (e4a4465b source); it is obsolete for runtime. a767596 then documented browser/PeerJS/GDrive; a21357a added detailed HLD/LLD pinned to 690b645. All automated diagram gates passed; optional perceptual review not requested.

690b645 added Pages workflow. First configure-pages failure was because Pages was not enabled; rerun succeeded. a21357a docs deployment and ff2a75c named-room/v0.9.2 deployment also succeeded. Current deployment evidence lives only in [rollout](../rollout.md).

## Compaction policy change

User initially required Context ignored. On 2026-10-13 user approved sanitized tracked Context and removal of contradictory active history. Raw notes were backed up locally; compact summaries replace repeated receipts, private details and stale instructions. Future revisions are recoverable in Git.
