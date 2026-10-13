# Verification ledger

Updated 2026-10-13. Evidence applies to listed revisions, not every later change.

| Revision / area | Verified evidence | Limit |
| --- | --- | --- |
| Current performance remediation | 73 Jest cases/21 suites, typecheck/Pages build/diff checks; encrypted mesh deltas under 2KB, gap repair, old-client fallback, pending-seek dispatch, stale unlink, history suppression, capture fallback and paused alias-only heartbeat; local guest chat/handover writes pass | No real authenticated Drive capture/settings or measured stutter improvement |

CI run 38395095485 at 530e6f1 failed npm test; deployment skipped. Detailed logs require signed-in access; public annotation only reports exit 1. Fixture now yields through native crypto (not only setImmediate loops), assertions tolerate unrelated heartbeat packets, and built-in Jest GitHub Actions reporter exposes future failure annotations. These are deterministic-test hardening, not a proven diagnosis of that inaccessible failure. Retry pending.
| ff2a75c room labels | 62 Jest cases/20 suites, typecheck, extension packaging, Pages build, diff check; browser custom title/header and title reset on leave | Popup label helper tested, actual installed Chrome extension not tested |
| ff2a75c deployment | Actions 38386807562 succeeds; hosted ZIP HTTP200 with v0.9.2 manifest and roomLabel popup | CI ZIP timestamps change digest; no byte-equality claim |
| a21357a docs | 61 tests, source-aware Archify HLD/LLD automated gates, browser guide expansion/diagram render and live docs | Optional perceptual review not requested; no security/media certification |
| b3e9e8b GDrive | 58 tests; simulated encrypted guest→non-host presenter ack/revoke, source pause/seek, stale calls and bridge origin/token cleanup; browser setup UI | No actual authenticated Drive capture or guest audio/video |
| 589a591 public defaults | 44 tests/typecheck/build; later two local public-PeerJS tabs joined and encrypted guest chat delivered | Not physical-device or difficult-network proof |
| 54bab2c authority | 43 tests; three local tabs, creator→eldest→next succession, sole survivor, unchanged invite, returning creator regular, retained history/chat, signaling restart | No arbitrary partition or background-throttling guarantee |
| Authority call locks | Local join/leave with devices off; contention rejects second tab and releases on leave | No camera/mic permission enabled |
| UI milestones | Local create/dialog/chat/fullscreen/divider; mobile overflow, finite reduced-motion reactions; focused stylesheet/render tests | Not pixel-perfect parity or real source delivery |

## Re-run

`npm run typecheck`, `npm test`, `npm run build:pages`, `git diff --check`. Run `npm run package:extension` before build when extension changes. Browser-test changed interactions; keep media device permissions explicit.

## Still required

Real two-device camera/mic and Drive audio/video; audible echo/noise/latency measurement; TURN-only/difficult networks; autoplay/device-denial/reconnect; host loss with independent presenter; background tabs/long sessions; dependency/security review and membership revocation.

Baseline latency diagnosis: native encryption snapshot-size benchmark and actual-handler replay confirmed volume growth/blocked dispatch at ff2a75c. Supplied recording reviewed offline, not actual RTC metrics. Remediation now implemented; tests cover small deltas, gap recovery, old clients, pending-seek dispatch, stale unlink results, unchanged history and capture fallback. Local public-PeerJS browser guest chat and sole-survivor handover/writes pass. No real Drive/network/quality assessment. Detailed cases and limits: [performance](performance.md).

## Context compaction

**Verified:** 64 Jest cases/21 suites, strict typecheck, Pages build and diff check pass. New tests enforce active-note budgets, relative links and absence of machine paths/invite keys/private accounts. Git ignore rule removed; built artifact has no Context files. Original untracked notes backed up outside Git; no runtime behavior changed. These checks are targeted hygiene, not a comprehensive secret/security audit.
