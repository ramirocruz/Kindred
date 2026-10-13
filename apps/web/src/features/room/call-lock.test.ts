import { reserveCall } from './services/call-lock';

describe('cross-tab call ownership', () => {
  it('holds the lock until leave and rejects a competing tab', async () => {
    let held = false;
    const requests: Promise<void>[] = [];
    const locks = {
      request: (_name: string, options: { ifAvailable: boolean }, callback: (lock: Lock | null) => Promise<void>): Promise<void> => {
        expect(options.ifAvailable).toBe(true);
        const lock = held ? null : { name: 'kindred-active-call', mode: 'exclusive' as const };
        if (lock) held = true;
        const request = callback(lock).finally(() => { if (lock) held = false; });
        requests.push(request);
        return request;
      },
    } as Pick<LockManager, 'request'>;
    const first = await reserveCall(locks);
    expect(first).not.toBeNull();
    expect(await reserveCall(locks)).toBeNull();
    first?.();
    await Promise.all(requests);
    const next = await reserveCall(locks);
    expect(next).not.toBeNull();
    next?.();
    await Promise.all(requests);
    expect(held).toBe(false);
  });
});
