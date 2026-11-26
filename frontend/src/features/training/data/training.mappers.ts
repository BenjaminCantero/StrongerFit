import type { Database } from '@strongerfit/contracts/database';
import type { Environment, Equipment, Level, Plan, PlanChange, PlannedExercise, PlanWarning, Zone } from '@strongerfit/training-engine';
import { currentTimeLabel, todayDateKey } from '../../../shared/calendar';
import type { WorkoutRecord } from '../../progress/domain/progress';
import type { OverloadDecision } from '../components/OverloadSuggestions';
import type { SessionState } from '../domain/session';
import type { TimerSpec } from '../domain/timers';

type Tables = Database['public']['Tables'];
type PlanRow = Tables['workout_plans']['Row'];
type DayRow = Tables['workout_days']['Row'];
type ExerciseRow = Tables['workout_exercises']['Row'];
type SessionRow = Tables['workout_sessions']['Row'];
type SetRow = Tables['performed_sets']['Row'];
type SuggestionRow = Tables['load_suggestions']['Row'];
type TimerRow = Tables['timer_presets']['Row'];

// Plan guardado: el del motor más su id y los ids de sus días (para editar ejercicios).
export type StoredPlan = Plan & { id: string; createdAt: string; dayIds: string[] };

export const exerciseColumns = (item: PlannedExercise, position: number) => ({
  position, exercise_id: item.exerciseId, sets: item.sets, reps_min: item.repsMin, reps_max: item.repsMax,
  rest_seconds: item.restSeconds, tempo: item.tempo ?? null, note: item.note ?? null,
});

export function planPayload(plan: Plan) {
  return {
    rule_version: plan.ruleVersion, template_id: plan.templateId, template_version: plan.templateVersion,
    catalog_version: plan.catalogVersion, environment: plan.environment, level: plan.input.level,
    days_per_week: plan.input.days, session_minutes: plan.input.minutes, equipment: plan.input.equipment, zones: plan.input.zones,
    changes: plan.changes, warnings: plan.warnings,
    days: plan.days.map((day, position) => ({
      position, weekday: day.weekday, name: day.name,
      exercises: day.exercises.map((item, index) => exerciseColumns(item, index)),
    })),
  };
}
export type PlanPayload = ReturnType<typeof planPayload>;

function exerciseFromRow(row: ExerciseRow): PlannedExercise {
  const tempo = row.tempo?.length === 3 ? row.tempo as [number, number, number] : null;
  return {
    exerciseId: row.exercise_id, sets: row.sets, repsMin: row.reps_min, repsMax: row.reps_max, restSeconds: row.rest_seconds,
    ...(tempo ? { tempo } : {}), ...(row.note ? { note: row.note } : {}),
  };
}

// La base guarda un solo entorno: el efectivo del plan (puede diferir del pedido si hubo
// environment-fallback, que queda en warnings).
export function planFromRows(plan: PlanRow, days: DayRow[], exercises: ExerciseRow[]): StoredPlan {
  const ordered = [...days].sort((a, b) => a.position - b.position);
  const environment = plan.environment as Environment;
  return {
    id: plan.id, createdAt: plan.created_at, dayIds: ordered.map((day) => day.id),
    ruleVersion: plan.rule_version, catalogVersion: plan.catalog_version, templateId: plan.template_id,
    templateVersion: plan.template_version, environment,
    input: { days: plan.days_per_week, minutes: plan.session_minutes, environment, equipment: plan.equipment as Equipment[],
      level: plan.level as Level, zones: plan.zones as Zone[] },
    changes: plan.changes as unknown as PlanChange[], warnings: plan.warnings as PlanWarning[],
    days: ordered.map((day) => ({
      name: day.name, weekday: day.weekday,
      exercises: exercises.filter((row) => row.day_id === day.id).sort((a, b) => a.position - b.position).map(exerciseFromRow),
    })),
  };
}

// Series completadas de ejercicios del catálogo. En los de tiempo, reps son segundos.
export function sessionPayload(state: SessionState, meta: { clientId: string; planId: string | null; dayId: string | null; finishedAt: Date }) {
  return {
    client_id: meta.clientId, plan_id: meta.planId, day_id: meta.dayId, title: state.title,
    started_at: new Date(meta.finishedAt.getTime() - state.elapsedMs).toISOString(), finished_at: meta.finishedAt.toISOString(),
    sets: state.exercises.flatMap((exercise, position) => {
      const exerciseId = exercise.exerciseId;
      if (!exerciseId) return [];
      const duration = exercise.measure === 'duration';
      return exercise.sets.filter((set) => set.completed).map((set) => ({
        exercise_id: exerciseId, exercise_position: position, set_number: set.id,
        weight_kg: duration ? null : set.weightKg, reps: duration ? null : set.reps, duration_seconds: duration ? set.reps : null,
        completed: true, kind: set.calibration ? 'calibration' as const : 'work' as const,
        reserve: set.reserve ?? null, estimated: set.estimated ?? false,
      }));
    }),
  };
}
export type SessionPayload = ReturnType<typeof sessionPayload>;

export type SessionWithSets = SessionRow & { performed_sets: SetRow[] };

export function workoutsFromRows(sessions: SessionWithSets[]): WorkoutRecord[] {
  return sessions.map((session) => {
    const finished = new Date(session.finished_at);
    const sets = session.performed_sets.filter((set) => set.completed)
      .sort((a, b) => a.exercise_position - b.exercise_position || a.set_number - b.set_number);
    const exercises: NonNullable<WorkoutRecord['exercises']> = [];
    for (const set of sets) {
      const entry = { weightKg: set.weight_kg ?? 0, reps: set.reps ?? set.duration_seconds ?? 0 };
      const last = exercises.at(-1);
      if (last?.exerciseId === set.exercise_id) last.sets.push(entry);
      else exercises.push({ exerciseId: set.exercise_id, sets: [entry] });
    }
    return {
      id: session.client_id, date: todayDateKey(finished), time: currentTimeLabel(finished), name: session.title,
      durationMinutes: Math.max(1, Math.round((finished.getTime() - new Date(session.started_at).getTime()) / 60_000)),
      volumeKg: sets.reduce((sum, set) => sum + (set.weight_kg ?? 0) * (set.reps ?? 0), 0), status: 'completed', exercises,
    };
  });
}

// BR-22: manda la decisión más reciente de cada ejercicio. Una carga aplicada o modificada
// queda pendiente hasta que una sesión posterior incluye ese ejercicio.
export function nextLoadsFromRows(suggestions: SuggestionRow[], sessions: SessionWithSets[]): Record<string, number> {
  const lastSession = new Map<string, string>();
  for (const session of sessions) {
    for (const set of session.performed_sets) {
      const seen = lastSession.get(set.exercise_id);
      if (!seen || session.finished_at > seen) lastSession.set(set.exercise_id, session.finished_at);
    }
  }
  const latest = new Map<string, SuggestionRow>();
  for (const row of suggestions) {
    const seen = latest.get(row.exercise_id);
    if (!seen || row.created_at > seen.created_at) latest.set(row.exercise_id, row);
  }
  const loads: Record<string, number> = {};
  for (const [exerciseId, row] of latest) {
    const accepted = (row.decision === 'applied' || row.decision === 'modified') && row.applied_kg !== null;
    const after = lastSession.get(exerciseId);
    if (accepted && (!after || new Date(row.created_at) > new Date(after))) loads[exerciseId] = row.applied_kg!;
  }
  return loads;
}

export const loadDecisionRow = (decision: OverloadDecision, ruleVersion: string, now: Date) => ({
  exercise_id: decision.exerciseId, kind: 'overload' as const, suggested_kg: decision.suggestedKg, applied_kg: decision.appliedKg,
  decision: decision.decision, rule_version: ruleVersion, decided_at: now.toISOString(),
});

// Solo los intervalos se recuerdan por ejercicio; el sostén sale del plan.
export const timerPresetRow = (exerciseId: string, restSeconds: number, spec: TimerSpec) => spec.kind === 'interval'
  ? { exercise_id: exerciseId, kind: 'interval' as const, rest_seconds: restSeconds, work_seconds: spec.workSeconds,
    interval_rest_seconds: spec.restSeconds, rounds: spec.rounds, hold_seconds: null }
  : { exercise_id: exerciseId, kind: 'hold' as const, rest_seconds: restSeconds, hold_seconds: spec.seconds,
    work_seconds: null, interval_rest_seconds: null, rounds: null };

export function timerSpecFromRow(row: TimerRow): TimerSpec | null {
  if (row.kind !== 'interval' || row.work_seconds === null || row.interval_rest_seconds === null || row.rounds === null) return null;
  return { kind: 'interval', workSeconds: row.work_seconds, restSeconds: row.interval_rest_seconds, rounds: row.rounds };
}
