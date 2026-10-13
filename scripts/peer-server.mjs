import { PeerServer } from 'peer';

// Signaling only: no room membership, chat, playback state or invitation secrets.
PeerServer({ host: '127.0.0.1', port: 9000, path: '/kindred', allow_discovery: false,
  alive_timeout: 10000, concurrent_limit: 200,
  corsOptions: { origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] },
});
console.info('Local PeerJS signaling: http://127.0.0.1:9000/kindred');
