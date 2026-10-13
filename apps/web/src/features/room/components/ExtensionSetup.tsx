import { Dialog } from './Dialog';

export function ExtensionSetup({ gdrive, onClose, onUnlink }: { gdrive: boolean; onClose: () => void; onUnlink?: () => void }): React.JSX.Element {
  return <Dialog eyebrow="Shared tab control" title={gdrive ? 'GDrive playback' : 'Interactive screen sharing'} onClose={onClose}>
    <p className="dialog-description">{gdrive
      ? 'Share a Google Drive video and use the room controls to play, pause, and seek together.'
      : 'Everyone in the room can operate the shared page. Only share a tab you trust room members to control. Chrome’s debugger warning is expected.'}</p>
    <ol className="extension-steps">
      <li>Install/update {gdrive ? 'Kindred GDrive v0.9.0' : 'Kindred Tab Control v0.8.0'}. Unzip the download, open Chrome Extensions, enable Developer mode, and choose Load unpacked. For an existing install, click Reload and refresh Kindred.</li>
      {gdrive ? <><li>Open and start your Drive video. Open Kindred GDrive, select your room, then Share GDrive tab.</li><li>Use the room playback controls and enable tab audio to listen.</li></> : <><li>On the source browser tab, open the extension, choose Interactive screen, then Link interactive tab.</li><li>Return here, enable Interactive control in Screen share, then choose the exact linked browser tab.</li><li>Stop sharing or unlink to revoke control. If another extension blocks debugging, use non-interactive sharing or a separate Chrome profile.</li></>}
    </ol>
    <p className="preview-note">{gdrive ? 'Only the presenter needs Chrome and this extension. Start the Drive video first. Audio plays in Kindred after unmuting the speaker; no debugger is used.' : 'Interactive screen sharing uses the legacy extension. React pairing remains pending.'}</p>
    <div className="dialog-actions"><a className="primary-button" href={gdrive ? '/downloads/kindred-gdrive-extension.zip' : '/downloads/kindred-tab-control-extension.zip'} download>Download extension</a>{onUnlink && <button className="secondary-button" onClick={onUnlink}>Stop sharing / unlink</button>}<button className="secondary-button" onClick={onClose}>Close</button></div>
  </Dialog>;
}
