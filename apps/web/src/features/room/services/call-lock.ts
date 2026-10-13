/** Holds an origin-wide Web Lock until leave, preventing duplicate call audio across tabs. */
export function reserveCall(locks: Pick<LockManager, 'request'>): Promise<(() => void) | null> {
  return new Promise((resolve, reject) => {
    void locks.request('kindred-active-call', { ifAvailable: true }, async (lock) => {
      if (!lock) { resolve(null); return; }
      await new Promise<void>((release) => resolve(release));
    }).catch(reject);
  });
}
