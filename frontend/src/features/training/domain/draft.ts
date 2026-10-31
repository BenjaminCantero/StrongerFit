import { z } from 'zod';
import type { SessionState } from './session';

// Borrador de la sesión en curso (RNF-06). Lo que no valida se descarta (RNF-13).
const setSchema = z.object({ id: z.number().int(), weightKg: z.number().min(0), reps: z.number().int().min(0), completed: z.boolean() });
const exerciseSchema = z.object({
  id: z.string(), name: z.string(), muscleGroup: z.string(), restSeconds: z.number().min(0),
  technique: z.array(z.string()), history: z.array(z.object({ label: z.string(), weightKg: z.number(), reps: z.number(), sets: z.number() })),
  sets: z.array(setSchema).min(1),
  timer: z.object({ kind: z.literal('hold'), seconds: z.number().positive() }).optional(),
  tempo: z.tuple([z.number(), z.number(), z.number()]).optional(),
});
const stateSchema = z.object({
  title: z.string(), exercises: z.array(exerciseSchema).min(1), exerciseIndex: z.number().int().min(0),
  status: z.enum(['active', 'paused', 'finished']), elapsedMs: z.number().min(0), runningSinceMs: z.number().nullable(),
  rest: z.object({ endsAtMs: z.number().nullable(), pausedRemainingMs: z.number().min(0), durationMs: z.number().min(0) }),
});
const draftSchema = z.object({
  version: z.literal(1), sessionId: z.string().min(1),
  source: z.discriminatedUnion('kind', [z.object({ kind: z.literal('plan'), day: z.number().int().min(0) }), z.object({ kind: z.literal('sample') })]),
  state: stateSchema, savedAt: z.string(),
});

export type SessionDraft = { version: 1; sessionId: string; source: { kind: 'plan'; day: number } | { kind: 'sample' }; state: SessionState; savedAt: string };

export const createDraft = (sessionId: string, source: SessionDraft['source'], state: SessionState, now: Date): SessionDraft =>
  ({ version: 1, sessionId, source, state, savedAt: now.toISOString() });

export function parseDraft(json: string | null): SessionDraft | null {
  if (!json) return null;
  try {
    const result = draftSchema.safeParse(JSON.parse(json));
    if (!result.success || result.data.state.status === 'finished') return null;
    const { state } = result.data;
    return state.exerciseIndex < state.exercises.length ? result.data as SessionDraft : null;
  } catch {
    return null;
  }
}
