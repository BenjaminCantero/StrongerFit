import type { Database, Json } from '@strongerfit/contracts/database';
import type { Plan, PlannedExercise } from '@strongerfit/training-engine';
import { db, requireUserId } from '../../../lib/data/client';
import { DataError, unwrap } from '../../../lib/data/errors';
import type { WorkoutRecord } from '../../progress/domain/progress';
import type { OverloadDecision } from '../components/OverloadSuggestions';
import type { TimerSpec } from '../domain/timers';
import { exerciseColumns, loadDecisionRow, nextLoadsFromRows, planFromRows, planPayload, timerPresetRow, timerSpecFromRow,
  workoutsFromRows, type SessionPayload, type SessionWithSets, type StoredPlan } from './training.mappers';

// Historial reciente: suficiente para récords, cargas y gráficos de un año de uso típico.
const HISTORY_LIMIT = 300;

type TimerInsert = Database['public']['Tables']['timer_presets']['Insert'];

// Las RPC devuelven el id creado; sin id la escritura no se confirmó.
function requireId(id: string | null): string {
  if (!id) throw new DataError('unknown');
  return id;
}

export async function fetchActivePlan(): Promise<StoredPlan | null> {
  const plan = unwrap(await db().from('workout_plans').select('*').eq('status', 'active').maybeSingle());
  if (!plan) return null;
  const days = unwrap(await db().from('workout_days').select('*').eq('plan_id', plan.id)) ?? [];
  const exercises = days.length
    ? unwrap(await db().from('workout_exercises').select('*').in('day_id', days.map((day) => day.id))) ?? []
    : [];
  return planFromRows(plan, days, exercises);
}

export async function saveWorkoutPlan(plan: Plan): Promise<string> {
  return requireId(unwrap(await db().rpc('save_workout_plan', { payload: planPayload(plan) as unknown as Json })));
}

export async function updatePlanExercise(dayId: string, index: number, exercise: PlannedExercise): Promise<void> {
  const { position: _position, ...columns } = exerciseColumns(exercise, index);
  unwrap(await db().from('workout_exercises').update(columns).eq('day_id', dayId).eq('position', index));
}

export async function submitSession(payload: SessionPayload): Promise<string> {
  return requireId(unwrap(await db().rpc('submit_session', { payload: payload as unknown as Json })));
}

export async function fetchTrainingHistory(): Promise<{ workouts: WorkoutRecord[]; nextLoads: Record<string, number> }> {
  const [sessions, suggestions] = await Promise.all([
    db().from('workout_sessions').select('*, performed_sets(*)').order('finished_at', { ascending: false }).limit(HISTORY_LIMIT),
    db().from('load_suggestions').select('*').order('created_at', { ascending: false }).limit(HISTORY_LIMIT),
  ]);
  const rows = (unwrap(sessions) ?? []) as SessionWithSets[];
  return { workouts: workoutsFromRows(rows), nextLoads: nextLoadsFromRows(unwrap(suggestions) ?? [], rows) };
}

export async function recordLoadDecision(decision: OverloadDecision, ruleVersion: string): Promise<void> {
  const row = unwrap(await db().from('load_suggestions').insert(loadDecisionRow(decision, ruleVersion, new Date())).select('id').single());
  unwrap(await db().from('recommendation_runs').insert({
    kind: 'load-suggestion', rule_version: ruleVersion, result_id: requireId(row?.id ?? null),
    params: { exercise_id: decision.exerciseId, suggested_kg: decision.suggestedKg },
  }));
}

export async function fetchTimerPresets(): Promise<Record<string, TimerSpec>> {
  const rows = unwrap(await db().from('timer_presets').select('*')) ?? [];
  return Object.fromEntries(rows.flatMap((row) => {
    const spec = timerSpecFromRow(row);
    return spec ? [[row.exercise_id, spec]] : [];
  }));
}

export async function saveTimerPreset(exerciseId: string, restSeconds: number, spec: TimerSpec): Promise<void> {
  await requireUserId();
  const row: TimerInsert = timerPresetRow(exerciseId, restSeconds, spec);
  unwrap(await db().from('timer_presets').upsert(row, { onConflict: 'user_id,exercise_id' }));
}
