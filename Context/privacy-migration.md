# Privacy and call quality

Updated 2026-10-13. See [authority](browser-authority.md) and [testing](testing.md).

## Implemented

- Random 256-bit invite secret remains in the invitation fragment/browser memory, not server request payloads or persistent app storage.
- Native Web Crypto AES-256-GCM, fresh 96-bit IVs, 128-bit tags. Chat authenticated context binds version/room/sender/message; room frames additionally bind endpoints/channel.
- Client-decrypted bounded ciphertext history; serialized inbox isolates corrupt messages and ignores disposed callbacks.
- Capability-based admission/control; peer IDs alone are not authorization. No plaintext fallback.
- WebRTC encrypted media/data transport; HTTPS/WSS outside loopback.
- Separate camera/mic and movie media. Devices start off; local preview mirrored/muted; outgoing image unchanged.
- Browser speech constraints request echo cancellation, noise suppression and gain control, up to 720p24–30fps camera. Incoming audio rendered once; stop tracks/close calls/release locks on leave.
- Same-origin Web Lock prevents competing joined calls across tabs.

## Explicit limitations

Public signaling/STUN/TURN defaults are currently approved; self-hosting optional, not automatic. Infrastructure sees setup metadata; direct peers may learn IPs. TURN relays encrypted WebRTC traffic, not a promise of metadata privacy.

Shared-key capability is not independent identity, forward secrecy, automatic key rotation or individual revocation. Create a new room to exclude saved-link holders. Invites can remain in clipboard/history. Served JavaScript, extensions, participants and endpoints remain trusted; participants can record.

No recording, analytics or sensitive logs by default. No custom cryptographic protocol or leak-proof/audited-E2EE claim. Never put TURN shared secrets in frontend variables.

## Open gates

Real audio quality/echo measurements, device denial/reconnect, TURN-only traversal, background behavior, dependency/security review, authenticated infrastructure abuse controls, short-lived TURN credential provisioning and stronger membership/key management. Optimize measured latency/quality adaptively, not maximum compression.
