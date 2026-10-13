# Environments and release gates

Updated 2026-10-13.

## Local

Node/npm setup and exact commands: [README](../README.md). `npm ci`, then `npm run dev`; internet required for approved PeerJS public defaults. Optional `npm run signaling` starts loopback-only official PeerServer for explicit self-hosted development configuration. No LiveKit or room-service credentials needed.

Never commit .env values or TURN shared secrets; only placeholders in .env.example. Do not expose development infrastructure publicly.

## Pages

- App: https://ramirocruz.github.io/Kindred/
- Architecture: https://ramirocruz.github.io/Kindred/architecture/
- Latest verified deployment: ff2a75c, Actions 38386807562, success.
- Performance remediation passes local 72 tests/typecheck/Pages build; publication pending. Refresh both participants and stop/re-share capture after deployment. Extension v0.9.2 unchanged; older app peers retain full-snapshot fallback and miss some optimizations.
- GitHub Pages source: GitHub Actions. SHA-pinned official actions run npm ci/typecheck/Jest/extension packaging/Pages build before deploy.
- Pages base `/Kindred/`; normal dev base `/`. Keep extension origin/path allowlists aligned.
- Packaging copies compiled app, downloads and four approved architecture HTML files. Context, .env and validation receipts excluded.
- Context is public in the repository by user approval; website exclusion does not make it private.
- After GDrive update, reload/reinstall extension and refresh room tabs.

Legacy ChatGPT-hosted app remains separate and unchanged. Pages deployment is not evidence of complete legacy parity. Initial Pages-not-enabled error was resolved; it is not a current blocker.

## Production-readiness gates

[Testing](testing.md) identifies real-media/TURN/device and security gaps. Other source adapters and interactive screen sharing remain pending. Resolve infrastructure/privacy decision and credential issuance before claiming self-hosted privacy. No promise of durable rooms, arbitrary-partition consensus, universal codecs/DRM or audited E2EE.
