import { estimatedMinutes as minutesFor, exerciseById, generatePlan, loadStep, techniqueFor, type Plan, type PlanDay } from '@strongerfit/training-engine';
import type { ProfileData } from '../../profile/domain/profile';
import type { WorkoutRecord } from '../../progress/domain/progress';
import { topSet } from '../../progress/domain/records';
import type { SessionTemplate } from './session';

// Entrada del generador desde el onboarding (BR-02: sin estos datos no se planifica).
export function planInput(profile: ProfileData) {
  const record = profile.onboarding;
  if (!record || profile.daysPerWeek === null || profile.sessionMinutes === null) return null;
  return { days: profile.daysPerWeek, minutes: profile.sessionMinutes, environment: record.environment, equipment: record.equipment,
    level: record.level, zones: record.zones };
}

export function createPlan(profile: ProfileData, now: Date): (Plan & { createdAt: string }) | null {
  const input = planInput(profile);
  return input ? { ...generatePlan(input), createdAt: now.toISOString() } : null;
}

export const estimatedMinutes = (day: PlanDay) => minutesFor(day.exercises);

const DAY = 86_400_000;
function ago(date: string, today: string) {
  const days = Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${date}T12:00:00Z`)) / DAY);
  return days <= 0 ? 'Hoy' : days === 1 ? 'Ayer' : `Hace ${days} días`;
}

// Últimas veces que se completó el ejercicio, con la serie más pesada de cada sesión.
export function exerciseHistory(workouts: WorkoutRecord[], exerciseId: string, today: string, limit = 3) {
  return workouts.filter((record) => record.status === 'completed' && record.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
    .flatMap((record) => {
      const log = record.exercises?.find((item) => item.exerciseId === exerciseId);
      if (!log?.sets.length) return [];
      const top = topSet(log.sets);
      return [{ label: ago(record.date, today), weightKg: top.weightKg, reps: top.reps, sets: log.sets.length, all: log.sets }];
    }).slice(0, limit);
}

// Carga por serie según BR-22: sobrecarga aceptada, luego la misma serie la última vez (o la última
// registrada) y, sin historial, una serie de calibración. Peso corporal y tiempo nunca llevan carga.
// Las repeticiones siguen el plan; la persona confirma o ajusta antes de completar.
export function sessionFromDay(day: PlanDay, workouts: WorkoutRecord[] = [], today = '', nextLoads: Record<string, number> = {}): SessionTemplate {
  return {
    title: day.name, elapsedSeconds: 0, initialRestSeconds: 0,
    exercises: day.exercises.map((item, index) => {
      const exercise = exerciseById(item.exerciseId)!;
      const history = exerciseHistory(workouts, item.exerciseId, today);
      const previous = history[0]?.all ?? [];
      const weighted = exercise.measure === 'weighted-reps';
      const accepted = nextLoads[item.exerciseId];
      const calibrate = weighted && accepted === undefined && !previous.length;
      const load = (set: number) => !weighted ? 0 : accepted ?? (previous[set] ?? previous.at(-1))?.weightKg ?? 0;
      return {
        id: `${item.exerciseId}-${index}`, exerciseId: item.exerciseId, name: exercise.name, muscleGroup: exercise.muscleGroup,
        restSeconds: item.restSeconds, measure: exercise.measure, repsMax: item.repsMax, loadStep: loadStep(exercise),
        technique: techniqueFor(item.exerciseId), history: history.map(({ all: _all, ...entry }) => entry),
        ...(exercise.kind === 'isometric' ? { timer: { kind: 'hold' as const, seconds: item.repsMax } } : {}),
        ...(item.tempo ? { tempo: item.tempo } : {}),
        sets: Array.from({ length: item.sets }, (_, set) => ({ id: set + 1, weightKg: load(set), reps: item.repsMax, completed: false,
          ...(calibrate && set === 0 ? { calibration: true } : {}) })),
      };
    }),
  };
}
