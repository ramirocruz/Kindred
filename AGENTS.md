# AGENTS.md

## Overview

Kindred is a static React + Vite watch-together app with browser-owned TypeScript room logic and PeerJS/WebRTC transport. Styling uses Tailwind CSS. PeerServer is connection infrastructure only; the custom room service, Socket.IO and LiveKit have been retired.

See [README.md](README.md) for setup, commands, and current limitations.

## Before Pushing

- Run `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check`.
- Commit coherent, scoped changes as progress is made. Include relevant sanitized Context updates. Never stage secrets, generated build output or IDE files.
- Update `README.md` whenever setup, commands, dependencies, user-visible capabilities, or significant limitations change.
- Current `lint` scripts run TypeScript checks, not ESLint.
- User-approved architecture HTML under `docs/architecture/` is a deployable documentation asset, exempt from the generated-build-output exclusion. Keep its validated source candidate and provenance reference; exclude Context and validation receipts from the Pages artifact. Context is public repository documentation, not private storage.

## Testing

- New or changed behavior requires focused Jest coverage.
- Verify changed interactions in the browser; compare migrated screens with the legacy UI.
- Distinguish local checks from genuine multi-device delivery and media verification.

## Scope

- Build Kindred here: React/Vite web client, browser room authority, and PeerJS/WebRTC media.
- The deployed legacy static app remains in `../couch-club-watch-party`; do not modify or deploy it unless the task explicitly targets it.
- Do not switch production to this workspace before feature parity and two-device verification.
- GitHub Pages is the separately approved migration deployment at `https://ramirocruz.github.io/Kindred/`; the legacy ChatGPT-hosted site remains unchanged. Actions must run tests/typecheck before deployment. Keep Pages subpath assets and extension origin/path allowlists aligned.
- Preserve original markup, appearance, and interactions during migration. Change infrastructure incrementally; do not redesign or silently replace working features with placeholders.
- Before migrating or correcting a UI feature, inspect its legacy markup, CSS, and handlers directly. Record deliberate differences; screenshots supplement source comparison rather than replace it.
- Keep unrelated cleanup and refactors out of the task. Explicitly document incomplete parity.

## Context is mandatory

Before every task, read `Context/README.md`, `Context/index.md`, `Context/current.md`, and only the topic documents relevant to the change. After every material change, update the relevant Context documents in the same task:

- `current.md`: current capabilities, boundaries and next priorities.
- `progress.md`: recent completed milestones with commit references.
- `decisions.md`: architecture or product decisions and trade-offs.
- `testing.md`: commands run, results, and verification limits.
- `rollout.md`: public environments, deployment gates and blockers; never credentials.

`Context/` is tracked by explicit user approval. Mark claims as **Verified**, **Implemented**, or **Hypothesis**. Do not present builds, fixtures, or syntax checks as proof of real multi-device media behavior. Do not store invitation keys, tokens, signed media URLs, private accounts, local absolute paths, raw transcripts, screenshots or machine validation receipts here.

### Context compaction

- Update facts in place; do not append the same milestone to several files. Keep decisions, evidence and deployment ownership separate, and link instead of repeating.
- On every Markdown update, skim related older notes and search for conflicting claims. Remove or correct stale active statements, fix their links, and retain useful superseded rationale only as an explicitly historical archive summary. Never leave two contradictory current instructions.
- Keep `current.md` within 80 lines, `index.md` within 60 lines and each active topic within 120 lines. Keep only the latest 10 milestones in `progress.md`.
- Compact at milestones, when a budget is exceeded, or when a decision is superseded. Move a concise historical summary into `Context/archive/` with dates, source/commit references, rationale and evidence limits. Preserve unresolved questions and useful diagnostic lessons.
- Read archive files only for historical questions; archive statements never override current code or direct user instructions. Verify source before treating old evidence as current behavior.
- Check links, privacy and stale statements before staging Context. Record the compaction date and evidence revision. Git history preserves later revisions; keep any initial untracked backup outside the repository.

## Established Patterns

- Prefer established, widely adopted libraries already in the stack. Add dependencies only for a concrete need; avoid custom substitutes for maintained transport, validation, or media libraries.

- Interface: React + Vite + TypeScript.
- Styling: Tailwind CSS.
- Room coordination: creator browser initially; eldest reachable admitted member succeeds after acquiring the stable PeerServer rendezvous address. A returning former host joins as an ordinary member at the end of the admission order.
- Camera, microphone, and screen media: PeerJS/WebRTC. User-approved legacy public signaling/ICE defaults are current; explicit self-hosted configuration remains optional. TODO: revisit hosting/privacy once decided.
- Intended personal-file transport: WebTorrent, isolated from room coordination; React delivery remains pending.
- Keep credentials in environment variables; never commit them.
- Authenticate browser admission/control frames with the invitation capability before accepting room state or media. Peer IDs alone are not authorization. Do not reintroduce room-service APIs/tickets or database authority without a new user decision.

## Privacy and call quality

- Use browser WebRTC encryption and HTTPS/WSS outside loopback development. Do not invent cryptographic algorithms or claim leak-proof security.
- Public PeerJS defaults are explicitly approved as a temporary legacy-parity choice, superseding the prior self-host-only rule. Document third-party metadata exposure; do not claim infrastructure is private/self-hosted. Browser room admission requires encrypted capability proof. Self-hosted abuse controls and short-lived TURN credentials remain future work; never embed a TURN shared secret in frontend configuration.
- Coordinator authority orders state changes; everyone retains shared playback permissions. Replicate membership/admission order and bounded history. Pause authority writes on ownership loss; reject stale generations. Do not claim eldest polling alone solves arbitrary network partitions.
- Encrypt chat on clients before transport. Key distribution, membership changes, replay rejection and server-side plaintext rejection are release gates; a tested encryption helper alone is not E2EE.
- Keep chat keys out of server requests, logs and persistent browser storage. Never silently fall back to plaintext on encryption failure.
- No recording, analytics or sensitive payload logging by default. Document metadata visibility, endpoint compromise, participant recording and P2P IP exposure.
- Enable microphone echo cancellation, noise suppression and gain control where supported. Render each incoming audio track once; stop tracks and close connections on leave.
- Keep movie/screen audio separate from speech processing. Optimize measured latency and quality with adaptive bitrate, not maximum compression or forced unsupported codecs.

## Code Standards

- Keep code small, readable, modular, and responsibility-focused.
- Remove redundancy. Extract a shared helper only after a pattern appears three or more times.
- Avoid speculative abstractions and unnecessary methods.
- Use comments for non-obvious intent, constraints, or trade-offs; avoid comments that repeat code.
- Use structured logs at service boundaries and lifecycle failures. Never log tokens, secrets, or private media data.
- If recent code contradicts this protocol, flag the contradiction before extending it.
- Avoid unnecessary `useEffect`; derive values, use event/query callbacks, or compute directly. A necessary effect must have a narrow purpose and cleanup.

### TypeScript

- Keep `strict` TypeScript enabled.
- Use `===` and `!==` only.
- Do not use `any`; use explicit types, unknown narrowing, or Zod inference.
- Prefer optional properties (`?`) over `| undefined` unless intentional undefined has distinct meaning.
- Give exported functions and hooks explicit return types.
### Component Structure

- Components focus on rendering and interaction. Keep transport and non-trivial transformations in feature services or utilities.
- Name components for their purpose. Prefer direct imports; do not add barrels or abstractions without a consumer.
- Follow existing feature patterns and keep cross-feature shared code outside feature internals.

### Styling & Theme

- Use Tailwind and existing stylesheet/theme tokens. Preserve Kindred's original visual design.
- Keep controls keyboard-accessible, labelled, and responsive. Do not introduce another styling framework for migration work.

### Mock Data

- Place mock data only under `src/mocks/` or feature-level `mocks/`, with proper types and Faker-generated values. Never hardcode mock participants in UI or route files.
- User-entered preview content is local state, not evidence of network delivery.
