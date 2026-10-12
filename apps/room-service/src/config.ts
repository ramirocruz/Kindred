import { z } from 'zod';

const configSchema = z.object({
  LIVEKIT_API_KEY: z.string().min(1).optional(),
  LIVEKIT_API_SECRET: z.string().min(1).optional(),
  LIVEKIT_URL: z.string().url().optional(),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  ROOM_TICKET_SECRET: z.string().min(32),
  WEB_ORIGIN: z.string().url(),
});

export type RoomServiceConfig = z.infer<typeof configSchema>;

export function loadRoomServiceConfig(environment: NodeJS.ProcessEnv): RoomServiceConfig {
  return configSchema.parse(environment);
}
