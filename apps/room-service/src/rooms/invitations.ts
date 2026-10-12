import { randomBytes, randomUUID } from 'node:crypto';
import { createRoomTicket } from '../auth/room-ticket.js';

interface Invitation { id: string; name: string; reactions: boolean; expiresAt: number }

/** In-memory capability links; restart invalidates all invitations. */
export class Invitations {
  private readonly invites = new Map<string, Invitation>();
  public constructor(private readonly secret: string) {}

  public create(name: string, reactions: boolean, now: number): string {
    for (const [key, invite] of this.invites) if (invite.expiresAt <= now) this.invites.delete(key);
    if (this.invites.size >= 1000) throw new Error('Room capacity reached. Try later.');
    const key = randomBytes(32).toString('base64url');
    this.invites.set(key, { id: randomUUID(), name, reactions, expiresAt: now + 86400000 });
    return key;
  }

  public join(key: string, displayName: string, now: number): { id: string; name: string; reactions: boolean; identity: string; ticket: string } | null {
    const invite = this.invites.get(key);
    if (!invite || invite.expiresAt <= now) return null;
    const identity = randomUUID();
    return { id: invite.id, name: invite.name, reactions: invite.reactions, identity,
      ticket: createRoomTicket({ roomId: invite.id, identity, displayName, expiresAt: invite.expiresAt }, this.secret) };
  }
}
