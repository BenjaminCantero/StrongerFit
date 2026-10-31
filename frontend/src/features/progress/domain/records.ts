import { exerciseById } from '@strongerfit/training-engine';
import type { ExerciseLog, WorkoutRecord } from './progress';

export type TopSet = { weightKg: number; reps: number };

// Mejor serie: más carga y, a igual carga, más repeticiones.
export const isBetter = (a: TopSet, b: TopSet) => a.weightKg > b.weightKg || (a.weightKg === b.weightKg && a.reps > b.reps);
export const topSet = (sets: TopSet[]) => sets.reduce((best, set) => isBetter(set, best) ? set : best);

const logsFor = (workouts: WorkoutRecord[], exerciseId: string) => workouts
  .filter((record) => record.status === 'completed')
  .flatMap((record) => record.exercises?.filter((log) => log.exerciseId === exerciseId && log.sets.length)
    .map((log) => ({ date: record.date, time: record.time, top: topSet(log.sets) })) ?? []);

export function bestSet(workouts: WorkoutRecord[], exerciseId: string): TopSet | null {
  const tops = logsFor(workouts, exerciseId).map((item) => item.top);
  return tops.length ? topSet(tops) : null;
}

// Récords de la sesión frente a todo lo anterior. La primera vez no cuenta como récord.
export function newRecords(previous: WorkoutRecord[], logs: ExerciseLog[]) {
  return logs.flatMap((log) => {
    const before = bestSet(previous, log.exerciseId);
    const top = topSet(log.sets);
    return before && isBetter(top, before) ? [{ exerciseId: log.exerciseId, top, before }] : [];
  });
}

export type ExerciseTrend = { exerciseId: string; name: string; points: (TopSet & { date: string })[]; best: TopSet; changeKg: number };

// Serie más pesada por sesión de cada ejercicio con carga en el período, ordenados por frecuencia.
export function exerciseTrends(workouts: WorkoutRecord[], from: string, today: string): ExerciseTrend[] {
  const inPeriod = workouts.filter((record) => record.date >= from && record.date <= today);
  const ids = [...new Set(inPeriod.flatMap((record) => record.status === 'completed' ? record.exercises?.map((log) => log.exerciseId) ?? [] : []))];
  return ids.map((exerciseId) => {
    const points = logsFor(inPeriod, exerciseId).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .map(({ date, top }) => ({ date, ...top }));
    return { exerciseId, name: exerciseById(exerciseId)?.name ?? exerciseId, points, best: topSet(points),
      changeKg: Math.round((points.at(-1)!.weightKg - points[0]!.weightKg) * 10) / 10 };
    // Sin carga (peso corporal, isométricos) el gráfico de kilos no aporta.
  }).filter((trend) => trend.points.length && trend.best.weightKg > 0).sort((a, b) => b.points.length - a.points.length || a.name.localeCompare(b.name));
}
