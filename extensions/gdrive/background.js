import { mediaOperation } from './media.js';
import { roomId, roomOriginAllowed } from './room-url.js';

const sourceAllowed = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && (['drive.google.com', 'docs.google.com'].includes(parsed.hostname) || parsed.hostname.endsWith('.googleusercontent.com'));
  } catch { return false; }
};
const frameAllowed = (url) => sourceAllowed(url) || url.startsWith('https://youtube.googleapis.com/');
const session = async () => (await chrome.storage.session.get('quietSession')).quietSession;
const roomSender = (sender) => sender.frameId === 0 && roomOriginAllowed(sender.url);
let queue = Promise.resolve(), queued = 0;

async function stop() {
  const share = await session();
  await chrome.storage.session.remove('quietSession');
  if (share) await chrome.tabs.sendMessage(share.roomTabId, { type: 'quiet-stop', token: share.token }, { frameId: 0 }).catch(() => {});
  return { ok: true };
}

async function discover(tabId) {
  const frames = (await chrome.webNavigation.getAllFrames({ tabId })).filter((frame) => frameAllowed(frame.url));
  const results = await Promise.all(frames.map(async (frame) => {
    try {
      const injected = await chrome.scripting.executeScript({ target: { tabId, frameIds: [frame.frameId] }, func: mediaOperation, args: [{ action: 'discover' }] });
      return injected.flatMap((result) => (Array.isArray(result.result) ? result.result : []).map((video) => ({ ...video, frameId: frame.frameId, documentId: result.documentId })));
    } catch { return []; } // Foreign/inaccessible extension frames must not block supported frames.
  }));
  const players = results.flat();
  if (players.length !== 1) throw new Error(players.length ? 'Close other visible players before sharing.' : 'No accessible video found. Open and start the Drive video first.');
  return players[0];
}

async function begin(tabId, roomTabId) {
  if (await session()) throw new Error('Stop your current share before starting another.');
  const source = await chrome.tabs.get(tabId), room = await chrome.tabs.get(roomTabId);
  const id = roomId(room.url);
  if (!sourceAllowed(source.url) || !id) throw new Error('Open your Drive video and select a Kindred room.');
  const info = await chrome.tabs.sendMessage(roomTabId, { type: 'quiet-prepare' }, { frameId: 0 });
  if (!info?.ok || info.room !== id) throw new Error(info?.message || 'Create or join a connected room first.');
  const roomFrame = await chrome.webNavigation.getFrame({ tabId: roomTabId, frameId: 0 });
  const player = await discover(tabId);
  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId, consumerTabId: roomTabId });
  const share = { tabId, roomTabId, roomDocumentId: roomFrame.documentId, room: id, player, title: (source.title || 'Drive video').slice(0, 200), token: crypto.randomUUID() };
  await chrome.storage.session.set({ quietSession: share });
  try {
    const result = await chrome.tabs.sendMessage(roomTabId, { type: 'quiet-start', streamId, token: share.token, room: id, title: share.title }, { frameId: 0 });
    if (!result?.ok) throw new Error(result?.message || 'Kindred could not start sharing.');
    return { ok: true, title: share.title };
  } catch (error) { await stop(); throw error; }
}

async function control(sender, command) {
  const share = await session();
  if (!share || !roomSender(sender) || sender.tab?.id !== share.roomTabId || sender.documentId !== share.roomDocumentId || command.token !== share.token || command.room !== share.room) {
    throw new Error('This room has no active shared tab.');
  }
  if (command.action === 'stop') return stop();
  if (!['state', 'play', 'pause', 'seek'].includes(command.action)) throw new Error('Unsupported playback command.');
  if (command.action === 'seek' && (!Number.isFinite(command.time) || command.time < 0)) throw new Error('Invalid seek time.');
  const [result] = await chrome.scripting.executeScript({ target: { tabId: share.tabId, documentIds: [share.player.documentId] }, func: mediaOperation,
    args: [{ action: command.action, time: command.time }, share.player.id] });
  if (result?.error || result?.result?.failure) throw new Error(result.result?.failure || result.error.message);
  if (!result?.result) throw new Error('No playback acknowledgement. Stop and share the tab again.');
  return { ok: true, state: result.result };
}

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (!message?.type?.startsWith('quiet-')) return;
  const popup = sender.url === chrome.runtime.getURL('popup.html');
  // Revoke immediately, even while a seek request is waiting for the source.
  if ((popup && message.type === 'quiet-stop') || (roomSender(sender) && message.type === 'quiet-control' && message.payload?.action === 'stop')) {
    (popup ? stop() : control(sender, message.payload)).then(reply, (error) => reply({ ok: false, message: error.message })); return true;
  }
  if (queued >= 20) { reply({ ok: false, message: 'Too many playback requests.' }); return; }
  queued++;
  const task = async () => {
    if (popup && message.type === 'quiet-begin') return begin(message.tabId, message.roomTabId);
    if (roomSender(sender) && message.type === 'quiet-control') return control(sender, message.payload || {});
    throw new Error('Unauthorized request.');
  };
  const next = queue.then(task); queue = next.catch(() => {});
  next.then(reply, (error) => reply({ ok: false, message: String(error.message).slice(0, 250) })).finally(() => queued--);
  return true;
});

async function revokeIf(test) { const share = await session(); if (share && test(share)) await stop(); }
chrome.tabs.onRemoved.addListener((id) => { void revokeIf((share) => id === share.tabId || id === share.roomTabId); });
chrome.webNavigation.onCommitted.addListener((event) => { void revokeIf((share) =>
  (event.tabId === share.roomTabId && event.frameId === 0) || (event.tabId === share.tabId && (event.frameId === 0 || event.frameId === share.player.frameId))); });
chrome.webNavigation.onReferenceFragmentUpdated.addListener((event) => { void revokeIf((share) => event.tabId === share.roomTabId && roomId(event.url) !== share.room); });
chrome.tabCapture.onStatusChanged.addListener((info) => { if (['stopped', 'error'].includes(info.status)) void revokeIf((share) => share.tabId === info.tabId); });
