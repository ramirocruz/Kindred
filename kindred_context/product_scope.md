# Product scope and decisions

## Latest decision — 2026-10-12

User changed the single playback-only design: add GDrive as a separate source and restore full interactive screen sharing behind an interactive/non-interactive toggle. Non-interactive is default; all members may interact when presenter explicitly enables and links. GDrive remains playback-only. Chrome-owned indicators are not hidden. This supersedes prior playback-only scope below.

## Current product intent

Kindred is a private, invite-based watch party for a close circle. It supports shared watching, room chat, reactions, camera/microphone calls, screen sharing, and personal-file sharing. Public hosting is not currently a priority.

## Shared control rule

All connected members can choose a source and control compatible playback. On 2026-10-12 the user accepted **playback-only** tab sharing (play/pause/seek) instead of full page interaction to avoid the large debugger/capture bars. Google Drive comes first. Only the presenter needs Chrome and the extension. Personal files, YouTube and web video retain separate source tabs; zoom is deferred. See [interactive_sharing.md](interactive_sharing.md).

The presenter can unlink the currently selected tab at any time from either the extension popup or the Kindred header. Unlinking stops subsequent room controls from being sent to that tab.

## Privacy and access

- Rooms are intended to be private and are entered through the complete invite link.
- Site access is currently restricted to the configured invited accounts.
- Personal files are sent peer-to-peer from the hosting browser while it remains available. The host should share only media they are allowed to distribute.

## Non-goals / limits to communicate clearly

- Kindred does not bypass DRM, browser permissions, autoplay rules, or a streaming service’s restrictions.
- MKV compatibility is browser/codecs dependent; MP4/WebM are safer choices.
- Tab control is a browser-extension integration, not a guarantee that every video site will be controllable.
