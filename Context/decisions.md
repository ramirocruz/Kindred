# Active decisions

Updated 2026-10-13. Historical choices are in [migration history](archive/migration-history.md).

| Decision | Rationale / limits |
| --- | --- |
| React/Vite/TypeScript + Tailwind | Preserve legacy UI while making responsibilities modular; Next.js unnecessary currently. |
| Browser authority, no custom room service | User selected creator-first, eldest-member succession, former-host ordinary rejoin. Signaling remains connection infrastructure. |
| PeerJS/WebRTC | Established browser transport wrapper. LiveKit/Socket.IO/service implementation retired. |
| Public PeerJS defaults temporarily | Explicit user approval for legacy-compatible local setup. Self-hosting optional; privacy/hosting decision remains TODO. |
| Native Web Crypto AES-GCM | Client invite-key chat/control encryption; no custom algorithm. Shared capability is not independent human identity or revocation. |
| Everyone controls playback | Host orders state; presenter owns capture and alone stops/unlinks its tab. |
| Separate GDrive and Screen share | GDrive media-only controls without debugger. Interactive screen-sharing remains requested, not migrated. |
| Media-first legacy layout | Movie primary, vertical call cards, adjustable sidebar, small bottom chat, translucent surfaces and transient reactions. |
| Private invitation rooms | Full invite grants entry; public Pages hosting is not account-based access control. |
| Context tracked and compacted | User superseded ignored-only policy. Public sanitized notes; archive summaries never override active state. |

WebTorrent is the intended isolated personal-file transport, not evidence that React file delivery works. Do not bypass DRM, browser permissions or codec restrictions. Revisit protocol/code conflicts explicitly rather than perpetuating obsolete notes.
