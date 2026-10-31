import { shiftDate, todayDateKey } from '../../../shared/calendar';
import { createProfilePreview } from '../../profile/data/profile.preview';
import { monthStart, type ProgressData, type WorkoutRecord } from '../domain/progress';

export function createProgressPreview(today = todayDateKey()): ProgressData {
  const recent: [number, number][] = [[27, 1500], [25, 1600], [23, 1700], [20, 1300], [18, 1300], [16, 1300], [14, 1300],
    [13, 1700], [11, 1700], [9, 1700], [6, 2100], [4, 650], [2, 2450], [1, 1820]];
  const names = ['Tren Superior & Core', 'Tren Inferior & Sentadilla', 'Movilidad & Recuperación', 'Fuerza Empuje & Tracción'];
  const workouts: WorkoutRecord[] = recent.map(([days, volumeKg], index) => ({
    id: `preview-${index}`, date: shiftDate(today, -days), time: index === 12 ? '07:15' : index === 11 ? '19:00' : '18:30',
    name: index === 13 ? names[0]! : index === 12 ? names[1]! : index === 11 ? names[2]! : index === 10 ? names[3]! : names[index % 4]!,
    durationMinutes: index === 13 ? 52 : index === 12 ? 58 : index === 11 ? 35 : 60, volumeKg, status: 'completed',
  }));
  for (const days of [22, 10]) workouts.push({ id: `missed-${days}`, date: shiftDate(today, -days), time: '18:30', name: 'Sesión planificada', durationMinutes: 0, volumeKg: 0, status: 'missed' });
  for (const [month, day, volumeKg, status] of [[-2, 5, 2800, 'completed'], [-2, 12, 3100, 'completed'], [-2, 20, 0, 'missed'], [-6, 10, 2600, 'completed'], [-6, 11, 0, 'missed']] as const) {
    workouts.push({ id: `older-${month}-${day}`, date: shiftDate(monthStart(today, month), day - 1), time: '18:30', name: names[0]!, durationMinutes: status === 'completed' ? 50 : 0, volumeKg, status });
  }
  // Series de ejemplo para el día 1 de la rutina de muestra: alimentan «la vez anterior».
  const day = createProfilePreview().trainingPlan!.days[0]!;
  const log = (base: number) => day.exercises.map((item, index) => ({ exerciseId: item.exerciseId,
    sets: Array.from({ length: item.sets }, (_, set) => ({ weightKg: index === day.exercises.length - 1 ? 0 : base - index * 5 + (set > 1 ? 2.5 : 0), reps: item.repsMax })) }));
  workouts[6] = { ...workouts[6]!, exercises: log(35) };
  workouts[13] = { ...workouts[13]!, exercises: log(37.5) };
  const weights = ([[35, 71.9], [27, 71.4], [24, 71.6], [20, 71.5], [17, 71.8], [13, 71.9], [10, 71.8], [6, 72.1], [3, 72.2]] as const)
    .map(([days, kg]) => ({ date: shiftDate(today, -days), kg }));
  return { workouts, weights };
}
