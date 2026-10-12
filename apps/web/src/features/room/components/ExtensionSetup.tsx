import { Dialog } from './Dialog';

export function ExtensionSetup({ gdrive, onClose }: { gdrive: boolean; onClose: () => void }): React.JSX.Element {
  return <Dialog eyebrow="Shared tab control" title={gdrive ? 'GDrive playback' : 'Interactive screen sharing'} onClose={onClose}>
    <p className="dialog-description">{gdrive
      ? 'Share a Google Drive video and use the room controls to play, pause, and seek together.'
      : 'Everyone in the room can operate the shared page. Only share a tab you trust room members to control. Chrome’s debugger warning is expected.'}</p>
    <ol className="extension-steps">
      <li>Install/update Kindred Tab Control v0.8.0. Unzip the download, open Chrome Extensions, enable Developer mode, and choose Load unpacked. For an existing install, click Reload and refresh Kindred.</li>
      {gdrive ? <><li>Open and start your Drive video. In the extension select GDrive playback, select your room, then Share GDrive tab.</li><li>Use the room playback controls and enable tab audio to listen.</li></> : <><li>On the source browser tab, open the extension, choose Interactive screen, then Link interactive tab.</li><li>Return here, enable Interactive control in Screen share, then choose the exact linked browser tab.</li><li>Stop sharing or unlink to revoke control. If another extension blocks debugging, use non-interactive sharing or a separate Chrome profile.</li></>}
    </ol>
    <p className="preview-note">This is the original extension for the existing Kindred site. Pairing with this React preview is still being migrated.</p>
    <div className="dialog-actions"><a className="primary-button" href="/downloads/kindred-tab-control-extension.zip" download>Download extension</a><button className="secondary-button" onClick={onClose}>Close</button></div>
  </Dialog>;
}
