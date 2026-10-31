import { exerciseById, generatePlan, type Plan, type PlanDay } from '@strongerfit/training-engine';
import type { ProfileData } from '../../profile/domain/profile';
import type { WorkoutRecord } from '../../progress/domain/progress';
import type { SessionTemplate } from './session';

// Entrada del generador desde el onboarding (BR-02: sin estos datos no se planifica).
export function planInput(profile: ProfileData) {
  const record = profile.onboarding;
  if (!record || profile.daysPerWeek === null || profile.sessionMinutes === null) return null;
  return { days: profile.daysPerWeek, minutes: profile.sessionMinutes, equipment: record.equipment, athleteProfile: record.athleteProfile,
    level: record.level, injury: record.healthFlags.includes('injury') };
}

export function createPlan(profile: ProfileData, now: Date): (Plan & { createdAt: string }) | null {
  const input = planInput(profile);
  return input ? { ...generatePlan(input), createdAt: now.toISOString() } : null;
}

export const estimatedMinutes = (day: PlanDay) =>
  Math.round(day.exercises.reduce((total, item) => total + item.sets * (45 + item.restSeconds), 0) / 60);

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
      const top = log.sets.reduce((best, set) => set.weightKg > best.weightKg || (set.weightKg === best.weightKg && set.reps > best.reps) ? set : best);
      return [{ label: ago(record.date, today), weightKg: top.weightKg, reps: top.reps, sets: log.sets.length, all: log.sets }];
    }).slice(0, limit);
}

// Cada serie parte con la carga de la misma serie la última vez (o la última serie registrada);
// las repeticiones siguen el plan. La persona confirma o ajusta antes de completar.
export function sessionFromDay(day: PlanDay, workouts: WorkoutRecord[] = [], today = ''): SessionTemplate {
  return {
    title: day.name, elapsedSeconds: 0, initialRestSeconds: 0,
    exercises: day.exercises.map((item, index) => {
      const exercise = exerciseById(item.exerciseId)!;
      const history = exerciseHistory(workouts, item.exerciseId, today);
      const previous = history[0]?.all ?? [];
      return {
        id: `${item.exerciseId}-${index}`, exerciseId: item.exerciseId, name: exercise.name, muscleGroup: exercise.muscleGroup,
        restSeconds: item.restSeconds, technique: [], history: history.map(({ all: _all, ...entry }) => entry),
        ...(exercise.kind === 'isometric' ? { timer: { kind: 'hold' as const, seconds: item.repsMax } } : {}),
        ...(item.tempo ? { tempo: item.tempo } : {}),
        sets: Array.from({ length: item.sets }, (_, set) => ({ id: set + 1, weightKg: (previous[set] ?? previous.at(-1))?.weightKg ?? 0, reps: item.repsMax, completed: false })),
      };
    }),
  };
}
