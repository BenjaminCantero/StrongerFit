import { describe, expect, it } from 'vitest';
import { createProfilePreview } from '../../profile/data/profile.preview';
import { createEmptyProfile } from '../../profile/domain/profile';
import { createEmptyProgress, type WorkoutRecord } from '../../progress/domain/progress';
import { weekStart } from '../../../shared/calendar';
import { activeWeeks, homeOverview } from './overview';

const today = '2026-10-29'; // jueves
const now = new Date('2026-10-29T15:00:00Z');
const zero = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
const workout = (date: string, name: string, status: WorkoutRecord['status'] = 'completed'): WorkoutRecord =>
  ({ id: `${date}-${name}`, date, time: '18:00', name, durationMinutes: 50, volumeKg: 1000, status });

describe('resumen de Inicio', () => {
  it('sin perfil ni registros deja todos los bloques vacíos', () => {
    expect(homeOverview({ profile: createEmptyProfile(), progress: createEmptyProgress(), consumed: zero, targets: null, today, now }))
      .toMatchObject({ firstName: null, activeWeeks: 0, workout: null, nutrition: null, adherence: null, weight: null });
  });

  it('sugiere el día de la rutina siguiente al último registrado', () => {
    const profile = createProfilePreview();
    const names = profile.trainingPlan!.days.map((day) => day.name);
    const progress = { workouts: [workout('2026-10-27', names[0]!), workout('2026-10-28', names[1]!)], weights: [] };
    const result = homeOverview({ profile, progress, consumed: zero, targets: null, today, now });
    expect(result.firstName).toBe('Camila');
    expect(result.workout).toMatchObject({ day: 2, title: names[2], doneToday: false });
    const last = { workouts: [workout('2026-10-29', names[3]!)], weights: [] };
    expect(homeOverview({ profile, progress: last, consumed: zero, targets: null, today, now }).workout).toMatchObject({ day: 0, doneToday: true });
  });

  it('marca la semana desde el lunes sin contar sesiones perdidas', () => {
    const profile = createProfilePreview();
    const progress = { workouts: [workout('2026-10-26', 'A'), workout('2026-10-27', 'B', 'missed'), workout('2026-10-25', 'C')], weights: [] };
    const adherence = homeOverview({ profile, progress, consumed: zero, targets: null, today, now }).adherence!;
    expect(adherence.days.map((day) => day.state)).toEqual(['completed', 'missed', 'missed', 'current', 'upcoming', 'upcoming', 'upcoming']);
    expect(adherence).toMatchObject({ completedSessions: 1, targetSessions: 4, last: { name: 'A', date: '2026-10-26' } });
  });

  it('calcula el avance hacia la meta de peso con el último registro', () => {
    const profile = createProfilePreview(); // 71,4 → 73 kg hasta el 24-12
    const progress = { workouts: [], weights: [{ date: '2026-10-20', kg: 72.2 }, { date: '2026-09-01', kg: 80 }] };
    const weight = homeOverview({ profile, progress, consumed: zero, targets: null, today, now }).weight!;
    expect(weight).toMatchObject({ currentKg: 72.2, targetKg: 73, weeksLeft: 8 });
    expect(weight.progress).toBeCloseTo(0.5);
  });
});

describe('semanas activas', () => {
  it('empieza en el lunes y no corta la racha por una semana en curso sin sesiones', () => {
    expect(weekStart('2026-11-01')).toBe('2026-10-26');
    expect(activeWeeks(['2026-10-20', '2026-10-14', '2026-10-01'], today)).toBe(2);
    expect(activeWeeks(['2026-10-29', '2026-10-20'], today)).toBe(2);
    expect(activeWeeks(['2026-10-08'], today)).toBe(0);
  });
});
