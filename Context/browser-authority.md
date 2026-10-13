# Browser room authority

Updated 2026-10-13. Source: `services/browser-room.ts`, `browser-room-state.ts`, `session.ts` under `apps/web/src/features/room/`.

## Implemented

- Creator generates room UUID, member identity and invite secret locally; no HTTP room API.
- Stable PeerServer alias `kindred-room-<UUID>` provides rendezvous. Identity Peer and coordinator-alias Peer have distinct roles.
- Encrypted hello proves invite capability. Coordinator assigns monotonically increasing admission order and publishes accepted snapshots.
- Authenticated mesh channels replicate membership, authority term/sequence, latest 100 encrypted chat envelopes and presentation.
- One-second polls and seven-second authority freshness timeout initiate rediscovery. Eldest reachable admitted member must acquire exclusive alias ownership before promotion.
- Ownership loss pauses coordinator writes. Stale room/generation updates are rejected.
- Returned creator gets fresh identity/order and ordinary membership. Unchanged invites discover successor.
- Presenter need not be coordinator; playback controls route to the current presenter.
- Close/pagehide stop local transport and media; transport closure/timeouts remove members. Unload delivery is not guaranteed.

## Evidence and limits

[Testing](testing.md) records local multi-tab succession, sole-survivor recovery and signaling restart. Single trusted signaling namespace/exclusive address is not arbitrary-partition consensus. Background throttling, unreachable members, latest unreplicated updates and hostile participants require further review.

16-member resource bound; replay/frame/history caps protect memory, not measured scale guarantees. All members offline ends the room. A successor cannot inherit a departed presenter's MediaStream or local file. No persistence or account identity service selected.

The supplied architecture conversation informed options; direct user choices prevail. Historical self-host-only and service-oriented requirements are superseded by [active decisions](decisions.md).
