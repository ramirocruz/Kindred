import { z } from 'zod';

export const playbackSchema = z.object({
  time: z.number().finite().nonnegative(), duration: z.number().finite().positive().nullable(), paused: z.boolean(),
}).strict();
export const driveActionSchema = z.object({
  action: z.enum(['state', 'play', 'pause', 'seek']), time: z.number().finite().nonnegative().optional(),
}).strict().refine((value) => value.action !== 'seek' || value.time !== undefined, 'Seek requires a time.');
export const presentationSchema = z.object({
  ownerId: z.string().uuid(), epoch: z.string().uuid(), title: z.string().min(1).max(200),
  playback: playbackSchema.nullable(), error: z.string().max(250),
}).strict();
export type PlaybackState = z.infer<typeof playbackSchema>;
export type DriveAction = z.infer<typeof driveActionSchema>;
export type Presentation = z.infer<typeof presentationSchema>;

/** Only a presenter can update/revoke its share; others must wait for release. */
export function canUpdatePresentation(current: Presentation | undefined, next: Presentation | null, sender: string): boolean {
  return (!next || next.ownerId === sender) && (!current || current.ownerId === sender)
    && (!current || !next || current.epoch === next.epoch);
}
