# Kindred development protocol

## Scope

- Build Kindred here: React/Vite web client, TypeScript room service, and LiveKit media.
- The deployed legacy static app remains in `../couch-club-watch-party`; do not modify or deploy it unless the task explicitly targets it.
- Do not switch production to this workspace before feature parity and two-device verification.

## Context is mandatory

Before every task, read `Context/README.md`, `Context/index.md`, and the documents relevant to the change. After every material change, update the relevant Context documents in the same task:

- `progress.md`: completed work, evidence, and next work.
- `decisions.md`: architecture or product decisions and trade-offs.
- `testing.md`: commands run, results, and verification limits.
- `rollout.md`: environments, credentials, deployment gates, and blockers.

`Context/` is intentionally ignored and must never be staged. Mark claims as **Verified**, **Implemented**, or **Hypothesis**. Do not present builds, fixtures, or syntax checks as proof of real multi-device media behavior.

## Architecture

- Interface: React + Vite + TypeScript.
- Styling: Tailwind CSS.
- Room coordination: TypeScript + Socket.IO service.
- Camera, microphone, and screen media: LiveKit.
- Personal-file transport: WebTorrent, isolated from room coordination.
- Keep credentials in environment variables; never commit them.
- Require signed room tickets before issuing media tokens or joining room coordination.

## Engineering standards

- Keep code small, readable, modular, and responsibility-focused.
- Remove redundancy. Extract a shared helper only after a pattern appears three or more times.
- Avoid speculative abstractions and unnecessary methods.
- Use comments for non-obvious intent, constraints, or trade-offs; avoid comments that repeat code.
- Use structured logs at service boundaries and lifecycle failures. Never log tokens, secrets, or private media data.
- If recent code contradicts this protocol, flag the contradiction before extending it.
- Avoid unnecessary `useEffect`; derive values, use event/query callbacks, or compute directly. A necessary effect must have a narrow purpose and cleanup.

## TypeScript and mocks

- Keep `strict` TypeScript enabled.
- Use `===` and `!==` only.
- Do not use `any`; use explicit types, unknown narrowing, or Zod inference.
- Prefer optional properties (`?`) over `| undefined` unless intentional undefined has distinct meaning.
- Give exported functions and hooks explicit return types.
- Place mock data only under `src/mocks/` or feature-level `mocks/`, with proper types and Faker-generated values. Never hardcode mock participants in UI or route files.

## Quality and Git

- Add focused Jest coverage for every new or changed behavior.
- Run relevant checks before committing: `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check`.
- Commit coherent, scoped changes as progress is made. Do not stage `.DS_Store`, IDE files, generated output, or ignored Context notes.
- The current `lint` scripts run TypeScript checks; add an actual ESLint configuration before claiming ESLint coverage.
