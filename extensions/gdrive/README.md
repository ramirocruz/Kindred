# Kindred GDrive

1. Open `chrome://extensions`, enable **Developer mode**, then **Load unpacked** this folder.
2. Refresh the Kindred room at localhost:5173, 127.0.0.1:5173, or https://ramirocruz.github.io/Kindred/.
3. Open and start a Google Drive video. Click this extension, select your room, then **Share GDrive tab**.
4. Return to Kindred. Enable speaker audio in the player; all room members can play, pause and seek.
5. Use **Stop sharing / unlink** in the popup or room to revoke.

Only the presenter needs Chrome and the extension. Guests need no extension. This build targets the React app's new invitations, not legacy rooms.

Playback uses an accessible HTML video in a supported Drive frame. Unsupported/protected players fail explicitly. Foreign extension frames are skipped. Capture stops when either tab closes/navigates or the room changes. GDrive uses no debugger; browser-owned capture indicators remain.

Chrome silences the source tab while captured. Audio is played once in Kindred after you unmute its player. Microphone processing never touches movie audio.

v0.9.1 includes the GitHub Pages origin, restricted to the Kindred path in application checks. Other hosting domains/ports require explicit manifest and room-origin allowlist updates. Interactive screen-sharing migration is separate; it is not included here.
