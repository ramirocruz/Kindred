import { roomId } from './room-url.js';
const status = document.querySelector('#status'), button = document.querySelector('#link'), room = document.querySelector('#room');
let source;
async function initialize() {
  [source] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabs = await chrome.tabs.query({ url: ['http://localhost:5173/*', 'http://127.0.0.1:5173/*', 'https://ramirocruz.github.io/Kindred/*', 'https://kindred.cheekyscout32.chatgpt.site/*'] });
  for (const tab of tabs) {
    if (!roomId(tab.url)) continue;
    const option = document.createElement('option'); option.value = tab.id;
    // Never display invitation fragments: they contain chat keys.
    option.textContent = `${tab.title || 'Kindred room'} · tab ${tab.id}`; room.append(option);
  }
  button.disabled = !room.options.length;
  status.textContent = room.options.length ? 'Choose a room. Stop/unlink before switching tabs.' : 'Create or join a Kindred room, then reopen this popup.';
}
void initialize().catch((error) => { status.textContent = error.message; });
button.onclick = async () => {
  button.disabled = true; status.textContent = 'Connecting…';
  try {
    const result = await chrome.runtime.sendMessage({ type: 'quiet-begin', tabId: source?.id, roomTabId: Number(room.value) });
    status.textContent = result.ok ? 'Sharing. Return to Kindred and enable tab audio.' : result.message;
  } catch (error) { status.textContent = error.message; }
  finally { button.disabled = !room.options.length; }
};
document.querySelector('#unlink').onclick = async () => {
  try { await chrome.runtime.sendMessage({ type: 'quiet-stop' }); status.textContent = 'Stopped and unlinked.'; }
  catch (error) { status.textContent = error.message; }
};
