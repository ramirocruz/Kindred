# Recent progress

Compacted 2026-10-13. Keep latest 10 milestones; older history belongs in [archive](archive/README.md).

| Milestone | Evidence / next work |
| --- | --- |
| GDrive lag diagnosis | Legacy/new paths compared; snapshot-volume benchmark and actual-handler replay confirm inefficient updates/control blocking. No live media bottleneck proven or runtime change; see performance.md. |
| Context compaction/tracking | 122,080→29,590 Markdown bytes before final evidence update (76% reduction), 890→326 lines. Active facts deduplicated, historical summaries archived, sanitized Context now Git-trackable. AGENTS requires related-note skim/correction every update. 64 tests/typecheck/Pages build/diff checks pass; no Context files in website artifact. No runtime change. |
| ff2a75c named rooms | Picker/header share room name and short code; title resets on leave; v0.9.2 package live. 62 tests pass. Real extension popup/capture pending. |
| a21357a detailed architecture | HLD/LLD diagrams + component/wire/flow guide published; 61 tests and Archify automated gates pass. |
| 690b645 Pages | React app/architecture/download deployment added; original setup error resolved. Legacy unchanged. |
| a767596 compact design | Browser authority/PeerJS/GDrive overview pinned to b3e9e8b; retained as historical compact diagram. |
| b3e9e8b GDrive | Debugger-free capture + authenticated shared controls, separate screen media, epochs/unlink/cleanup; 58 tests. Real Drive AV pending. |
| 589a591 public defaults | User-approved temporary legacy PeerJS defaults restored; self-hosting optional; hosting/privacy TODO. |
| 54bab2c browser authority | Retired service/Socket.IO/LiveKit; encrypted mesh, admission order, eldest succession and ordinary host rejoin; browser succession verified. |

Next: real Drive/two-device media verification, remaining source adapters/UI parity, infrastructure/security decisions. Detailed current state: [current](current.md). Earlier foundation and legacy receipts are historical, not active blockers.
