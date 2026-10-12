import { createHmac, timingSafeEqual } from 'node:crypto';

import { z } from 'zod';

const claimsSchema = z.object({
  displayName: z.string().trim().min(1).max(24),
  expiresAt: z.number().int().positive(),
  identity: z.string().uuid(),
  roomId: z.string().trim().min(1).max(80),
});

export type RoomTicketClaims = z.infer<typeof claimsSchema>;

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createRoomTicket(claims: RoomTicketClaims, secret: string): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyRoomTicket(ticket: string, secret: string, now: number): RoomTicketClaims | undefined {
  const [payload, signature, extra] = ticket.split('.');
  if (!payload || !signature || extra) {
    return undefined;
  }

  const expected = Buffer.from(sign(payload, secret));
  const supplied = Buffer.from(signature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return undefined;
  }

  try {
    const claims = claimsSchema.parse(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')));
    return claims.expiresAt > now ? claims : undefined;
  } catch {
    return undefined;
  }
}
