import { z } from 'zod';
import type { SessionPayload } from '../data/training.mappers';

// Sesión terminada que aún no confirma el servidor (RNF-06, CA-03). Se guarda en el teléfono
// y se borra solo cuando submit_session devuelve el id.
const setSchema = z.object({
  exercise_id: z.string().min(1), exercise_position: z.number().int().min(0), set_number: z.number().int().min(1),
  weight_kg: z.number().nullable(), reps: z.number().int().nullable(), duration_seconds: z.number().int().nullable(),
  completed: z.boolean(), kind: z.enum(['work', 'calibration']), reserve: z.number().int().nullable(), estimated: z.boolean(),
});
const schema = z.object({
  title: z.string(), completedSets: z.number().int().min(0), totalSets: z.number().int().min(0),
  payload: z.object({
    client_id: z.uuid(), plan_id: z.string().nullable(), day_id: z.string().nullable(), title: z.string().min(1),
    started_at: z.string(), finished_at: z.string(), sets: z.array(setSchema),
  }),
});

export type PendingSession = { payload: SessionPayload; title: string; completedSets: number; totalSets: number };

export function parsePending(json: string | null): PendingSession | null {
  if (!json) return null;
  try {
    const result = schema.safeParse(JSON.parse(json));
    return result.success ? result.data as PendingSession : null;
  } catch {
    return null;
  }
}
