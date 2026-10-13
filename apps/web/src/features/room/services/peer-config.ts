import { z } from 'zod';
import type { PeerOptions } from 'peerjs';

const iceServerSchema = z.object({
  urls: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  username: z.string().optional(), credential: z.string().optional(),
}).strict();

export function peerOptions(endpoint: string, iceJson = '[]', relayOnly = false): PeerOptions {
  const url = new URL(endpoint);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) {
    throw new Error('Configure HTTPS signaling; HTTP is allowed only on localhost.');
  }
  const iceServers = z.array(iceServerSchema).parse(JSON.parse(iceJson));
  if (relayOnly && !iceServers.some((server) => [server.urls].flat().some((value) => /^turns?:/.test(value)))) {
    throw new Error('Relay-only mode requires a configured TURN server.');
  }
  return { host: url.hostname, port: Number(url.port || (url.protocol === 'https:' ? 443 : 80)),
    path: url.pathname, secure: url.protocol === 'https:', debug: 0,
    config: { iceServers, iceTransportPolicy: relayOnly ? 'relay' : 'all' } };
}
