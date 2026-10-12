import { Dialog } from "./Dialog";
import type { Source } from "../local-room";

export function SourceSetup({ source, onClose }: { source: Source; onClose: () => void }): React.JSX.Element {
  const personal = source === "Personal file";
  return (
    <Dialog eyebrow={source} title={personal ? "Play from your device." : "Play a link together."} onClose={onClose}>
      <p className="dialog-description">
        {personal ? "MP4 is the most reliable format; MKV playback depends on your browser’s codecs." : "Paste a YouTube link or direct video URL for this source."}
      </p>
      <label className="field">
        {personal ? "Choose a video file" : "Video URL"}
        {personal ? <input type="file" accept="video/*,.mp4,.mkv,.webm" /> : <input type="url" placeholder={source === "YouTube" ? "https://www.youtube.com/watch?v=…" : "https://example.com/video.mp4"} />}
      </label>
      <p className="preview-note">Playback and sharing are not connected in this preview. Nothing selected here is uploaded or sent.</p>
      <div className="dialog-actions">
        <button className="secondary-button" onClick={onClose}>Cancel</button>
        <button className="primary-button" disabled>{personal ? "Share with room →" : "Load video →"}</button>
      </div>
    </Dialog>
  );
}
