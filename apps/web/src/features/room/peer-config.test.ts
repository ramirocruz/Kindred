import { peerOptions } from './services/peer-config';

describe('private signaling configuration', () => {
  it('uses legacy PeerJS defaults when no endpoint is configured', () => {
    expect(peerOptions()).toEqual({ debug: 0 });
    expect(peerOptions('  ')).not.toHaveProperty('config');
    expect(() => peerOptions('', '[]', true)).toThrow();
    expect(() => peerOptions('', '[{"urls":"stun:example.org"}]')).toThrow();
  });
  it('explicitly disables default third-party ICE services', () => {
    const config = peerOptions('http://127.0.0.1:9000/kindred');
    expect(config.host).toBe('127.0.0.1');
    expect(config.config?.iceServers).toEqual([]);
    expect(config.secure).toBe(false);
  });
  it('requires HTTPS outside loopback and TURN for relay-only calls', () => {
    expect(() => peerOptions('http://signaling.example/kindred')).toThrow();
    expect(() => peerOptions('https://signaling.example/kindred', '[]', true)).toThrow();
    const config = peerOptions('https://signaling.example/kindred', '[{"urls":"turns:turn.example:5349","username":"temporary","credential":"temporary"}]', true);
    expect(config.secure).toBe(true);
    expect(config.config?.iceTransportPolicy).toBe('relay');
  });
});
