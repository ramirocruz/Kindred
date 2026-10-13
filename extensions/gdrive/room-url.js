const origins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173', 'https://kindred.cheekyscout32.chatgpt.site']);
export function roomOriginAllowed(url) {
  try { return origins.has(new URL(url).origin); } catch { return false; }
}
export function roomId(url) {
  try {
    const parsed = new URL(url);
    if (!origins.has(parsed.origin)) return null;
    const params = new URLSearchParams(parsed.hash.slice(1));
    const id = params.get('invite');
    return params.getAll('invite').length === 1 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '') ? id : null;
  } catch { return null; }
}
