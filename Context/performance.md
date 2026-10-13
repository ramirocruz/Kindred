# GDrive latency diagnosis

Date 2026-10-13; inspected runtime ff2a75c. Diagnosis only: no playback/media implementation changed. User confirms both browsers Chrome, GitHub Pages, guest video stuttering rather than merely delayed. Exact hardware, network, command latency and chat volume remain unknown.

## Member recording reviewed

Offline decoding of supplied 10.2-second phone recording succeeded. Container is H.264, 576×1024, ~29.9fps; these describe the recording, NOT delivered WebRTC FPS. Inspected sequential samples across the clip and 0.2-second samples of its last four seconds: movie poses persist then change abruptly, while camera movement continues and room chrome stays present. No visible whole-page reload in inspected samples. Anime intentionally holds poses, so missing/intermediate frames and freeze duration cannot be attributed conclusively without source-side comparison. This supports the reported uneven-motion symptom, not a network/CPU/codec diagnosis. Audio quality not assessed; no playback clicks evident in inspected samples to time control response. No raw recording, screenshots, invite fragments or personal desktop details committed.

## Confirmed implementation differences

- `GDriveBridge` polls state every 1.5 seconds, as legacy does. Each successful new update commits presentation and `BrowserRoom.publish` broadcasts a full snapshot, including up to 100 chat envelopes, through mesh and authenticated alias channels. A guest with both connections gets duplicate network payloads (second same-sequence snapshot is discarded after decryption).
- Legacy `interactive-room.js` broadcasts compact `quiet-state` only for playback, not chat history.
- `useRoomConnection.onState` feeds every accepted snapshot into `EncryptedChatInbox`; history decode reruns on all entries, even unchanged, and produces new UI arrays.
- Incoming channel promise chain awaits `BrowserRoom.receive`; `drive-control` awaits the extension operation before completing. Later frames on that same channel, including heartbeat/pause, cannot dispatch until it finishes. Legacy starts control promise without awaiting it in the overall receive handler.
- The extension's serialized command queue and five-second native play/seek waits exist in BOTH versions. They can delay commands behind a pending seek, but are not a newly introduced differential by themselves.
- A non-coordinator presenter additionally awaits coordinator presentation commit/ack before returning playback result. This extra coordination round trip does not apply when presenter is also host, as in the reported session.

## Local diagnostics (synthetic, not network measurements)

Ran actual `room-frame.ts` and `chat-crypto.ts` via TypeScript transpilation/native Web Crypto. Two-member ASCII fixtures, JSON frame length before PeerJS framing/network overhead:

| History | One snapshot | Two copies every 1.5s |
| --- | --- | --- |
| Empty | ~889 bytes | ~0.009 Mbps |
| 10 × 40 characters | ~6.3 KB | ~0.068 Mbps |
| 100 × 40 characters | ~55 KB | ~0.59 Mbps |
| 100 × 2,000 characters | ~988 KB | ~10.54 Mbps |

Legacy comparable quiet-state JSON: 158 bytes. These are constructed cases, not the user's history or packet capture. Actual capture bitrate/channel topology unknown. Single snapshot sealing measured ~0.2–1ms for small/short cases and ~13–15ms for maximum history on this machine; do not blame AES itself for seconds of lag. Ciphertext byte arrays plus JSON/base64 and redundant history magnify volume.

Executed actual new `attach`/`receive` methods with transport/decryption stubs and a deferred seek. While unresolved: only seek invoked, subsequent ping did not refresh authority, pause not dispatched. On resolving: ping/pause processed. This confirms application-level blocking, not actual Drive/network timing.

## What comparison does NOT establish

- Both GDrive paths use identical mandatory Chrome tab-source capture constraints and one `peer.call` per guest. Neither tunes movie track resolution/frame rate/contentHint/sender bitrate. Camera constraints do not govern movie capture.
- Legacy vendored PeerJS 1.5.4 and installed 1.5.5 list the same Google STUN and EU/US PeerJS TURN URLs; selected candidate pairs can still differ per call. Public defaults alone are not a proven migration cause.
- Movie video is not encoded by the custom chat encryption helper; WebRTC carries it. Pages serves assets, not live media/control traffic.
- `GDriveVideo` dependencies are stream, stable ref and stable setNotice callback. Ordinary presentation state rerenders do not prove recurring video srcObject resets; epoch/owner changes do clear calls intentionally.
- 1.5s polling is source-state refresh, not a mandatory 1.5s sleep before each click. Source-action latency and guest seeing newly captured frames are distinct measurements.
- No live session was available/inspected. CPU encoding, decode/render drops, congestion, TURN route and jitter-buffer delay remain hypotheses. Large data channels can block data traffic; media uses separate PeerJS calls, so do not equate data HOL directly with RTP frame blocking. Shared uplink/CPU pressure can affect both.

## Recommended next work (not implemented)

1. A/B legacy/new under same devices/network/video, two participants, with camera off and empty versus populated chat.
2. Capture privacy-safe numeric stats: movie capture dimensions/FPS; outbound bitrate/FPS/qualityLimitationReason/encode time; inbound loss/jitter/FPS/freezes/decode time; selected candidate type/protocol and RTT; buffer depth. No SDP, IPs, keys or media URLs in committed logs.
3. Timestamp click, presenter receive, extension result, guest ack/state and first visible resulting frame. Distinguish actual source pause from delayed captured image.
4. Decouple authenticated frame dispatch from slow playback work while preserving ordered validation, epoch checks and bounded source serialization. Use playback deltas, avoid duplicate updates and unchanged chat decrypts. Keep encryption.
5. Tune motion capture/adaptive sender only after measurements; blindly forcing bitrate/codecs or an extra relay may worsen quality. Verify two-device latency before claiming legacy parity.

## Primary sources

- [WebRTC stats](https://www.w3.org/TR/webrtc-stats/): quality limitations, RTT, encode/decode and jitter-buffer metrics.
- [MDN data channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels): buffering and large-message head-of-line blocking.
- [Chrome tabCapture](https://developer.chrome.com/docs/extensions/reference/api/tabCapture): captured tab MediaStream and source audio behavior.
- [MDN sender parameters](https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpSender/setParameters): bitrate/resolution adaptation.
- [MDN getStats](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats): live connection measurement.
