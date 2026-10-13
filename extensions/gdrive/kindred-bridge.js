(() => {
  if (globalThis.__kindredQuietBridge) return;
  globalThis.__kindredQuietBridge = true;
  const pending = new Map(), channel = 'kindred-tab-control';
  const post = (type, payload) => window.postMessage({ channel, type, payload }, location.origin);
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (sender.id !== chrome.runtime.id) return;
    if (message.type === 'quiet-stop') { post('quiet-stop', { token: message.token }); reply({ ok: true }); return; }
    if (!['quiet-prepare', 'quiet-start'].includes(message.type)) return;
    const id = crypto.randomUUID();
    const timer = setTimeout(() => { pending.delete(id); reply({ ok: false, message: 'Refresh Kindred and try again.' }); }, 10000);
    pending.set(id, { reply, timer }); post(message.type, { ...message, id }); return true;
  });
  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== location.origin || event.data?.channel !== channel) return;
    const { type, payload } = event.data;
    if (type === 'quiet-response') {
      const request = pending.get(payload?.id);
      if (request) { clearTimeout(request.timer); pending.delete(payload.id); request.reply(payload); }
    }
    if (type === 'quiet-command') chrome.runtime.sendMessage({ type: 'quiet-control', payload }, (result) => {
      post('quiet-result', { id: payload?.id, ...(chrome.runtime.lastError ? { ok: false, message: chrome.runtime.lastError.message } : result) });
    });
  });
})();
