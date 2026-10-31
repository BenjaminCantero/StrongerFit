import { describe, expect, it } from 'vitest';
import type { WorkoutRecord } from './progress';
import { bestSet, exerciseTrends, newRecords } from './records';

const workout = (id: string, date: string, sets: [number, number][], status: WorkoutRecord['status'] = 'completed'): WorkoutRecord => ({
  id, date, time: '18:00', name: 'A', durationMinutes: 40, volumeKg: 0, status,
  exercises: [{ exerciseId: 'bench-press', sets: sets.map(([weightKg, reps]) => ({ weightKg, reps })) }],
});
const history = [workout('a', '2026-10-10', [[40, 10], [42.5, 8]]), workout('b', '2026-10-17', [[42.5, 9]]), workout('c', '2026-10-20', [[60, 10]], 'missed')];

describe('récords por ejercicio', () => {
  it('toma la serie con más carga y, a igual carga, más repeticiones; ignora sesiones no realizadas', () => {
    expect(bestSet(history, 'bench-press')).toEqual({ weightKg: 42.5, reps: 9 });
    expect(bestSet(history, 'squat')).toBeNull();
  });

  it('marca récord solo si supera lo anterior y no en la primera vez', () => {
    const logs = (sets: [number, number][]) => [{ exerciseId: 'bench-press', sets: sets.map(([weightKg, reps]) => ({ weightKg, reps })) }];
    expect(newRecords(history, logs([[42.5, 10]]))).toEqual([{ exerciseId: 'bench-press', top: { weightKg: 42.5, reps: 10 }, before: { weightKg: 42.5, reps: 9 } }]);
    expect(newRecords(history, logs([[42.5, 9]]))).toEqual([]);
    expect(newRecords([], logs([[20, 10]]))).toEqual([]);
  });

  it('resume la carga por sesión dentro del período', () => {
    const [trend] = exerciseTrends(history, '2026-10-01', '2026-10-31');
    expect(trend).toMatchObject({ exerciseId: 'bench-press', name: 'Press de banca con barra', changeKg: 0, best: { weightKg: 42.5, reps: 9 } });
    expect(trend!.points.map((point) => point.date)).toEqual(['2026-10-10', '2026-10-17']);
    expect(exerciseTrends(history, '2026-10-18', '2026-10-31')).toEqual([]);
    expect(exerciseTrends([workout('d', '2026-10-12', [[0, 30]])], '2026-10-01', '2026-10-31')).toEqual([]);
  });
});
