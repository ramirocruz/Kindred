# AGENTS.md

## Overview

Kindred is a private watch-together app migrating to React + Vite, a TypeScript room service, and LiveKit media. Styling uses Tailwind CSS; room coordination uses Socket.IO.

See [README.md](README.md) for setup, commands, and current limitations.

## Before Pushing

- Run `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check`.
- Commit coherent, scoped changes as progress is made. Never stage secrets, generated output, IDE files, or ignored Context notes.
- Update `README.md` whenever setup, commands, dependencies, user-visible capabilities, or significant limitations change.
- Current `lint` scripts run TypeScript checks, not ESLint.

## Testing

- New or changed behavior requires focused Jest coverage.
- Verify changed interactions in the browser; compare migrated screens with the legacy UI.
- Distinguish local checks from genuine multi-device delivery and media verification.

## Scope

- Build Kindred here: React/Vite web client, TypeScript room service, and LiveKit media.
- The deployed legacy static app remains in `../couch-club-watch-party`; do not modify or deploy it unless the task explicitly targets it.
- Do not switch production to this workspace before feature parity and two-device verification.
- Preserve original markup, appearance, and interactions during migration. Change infrastructure incrementally; do not redesign or silently replace working features with placeholders.
- Before migrating or correcting a UI feature, inspect its legacy markup, CSS, and handlers directly. Record deliberate differences; screenshots supplement source comparison rather than replace it.
- Keep unrelated cleanup and refactors out of the task. Explicitly document incomplete parity.

## Context is mandatory

Before every task, read `Context/README.md`, `Context/index.md`, and the documents relevant to the change. After every material change, update the relevant Context documents in the same task:

- `progress.md`: completed work, evidence, and next work.
- `decisions.md`: architecture or product decisions and trade-offs.
- `testing.md`: commands run, results, and verification limits.
- `rollout.md`: environments, credentials, deployment gates, and blockers.

`Context/` is intentionally ignored and must never be staged. Mark claims as **Verified**, **Implemented**, or **Hypothesis**. Do not present builds, fixtures, or syntax checks as proof of real multi-device media behavior.

## Established Patterns

- Interface: React + Vite + TypeScript.
- Styling: Tailwind CSS.
- Room coordination: TypeScript + Socket.IO service.
- Camera, microphone, and screen media: LiveKit.
- Personal-file transport: WebTorrent, isolated from room coordination.
- Keep credentials in environment variables; never commit them.
- Require signed room tickets before issuing media tokens or joining room coordination.

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
