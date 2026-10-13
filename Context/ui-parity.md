# UI fidelity and remaining parity

Updated 2026-10-13. Inspect legacy `../couch-club-watch-party/dist/index.html`, `room-layout.css` and feature handlers before changing migrated UI. Legacy is untouched.

| Area | Current React status |
| --- | --- |
| Landing/create | Original hero, form, feature cards, proportions and compact reaction switch restored. |
| Header | Brand, named room/status/member count; short matching room code added in ff2a75c. |
| Sources | Single-line tabs enter source segments, not automatic URL dialogs. GDrive implemented; other adapters pending/disabled. |
| Artwork/player | Legacy-style welcome/film card and circular controls; GDrive real timeline, speaker in play row. |
| Fullscreen | Movie takes available space; hover/focus controls, right participants retained. |
| Divider | Pointer/keyboard adjustable sidebar width, bounds/reset; hidden at narrow breakpoint. |
| Participants | Vertical cards, aspect-ratio geometry, zoom and small local hover/focus camera/mic controls; local-only mirror. Bounded dragging pending. |
| Chat | Compact viewport-bottom collapsible translucent dock, scrolling, clear action and encrypted shared delivery. |
| Reactions | Translucent tray; unique event replay and finite 1.6-second fade/float; reduced-motion cleanup. |
| Settings/invite | Shared controls, reaction preference, real invitation and leave action. |
| Extension setup | Separate GDrive v0.9.2 and historical interactive v0.8.0 guide; old interactive download is not working React pairing. |

Evidence: local browser UI checks and focused contracts in [testing](testing.md). Narrow layouts intentionally stack instead of unusably thin legacy columns; needs product validation. Not pixel-perfect or complete functional parity. Compare current source, not old local-preview-only statements.
