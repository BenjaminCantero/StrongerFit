import { describe, expect, it } from 'vitest';
import { shiftDate } from '../../../shared/calendar';
import { idealAt, movingAverage, weightGoalSummary } from './weight-goal';

const goal = { startKg: 80, targetKg: 76, startDate: '2026-11-02', endDate: shiftDate('2026-11-02', 56) };

describe('objetivo de peso', () => {
  it('cumple CA-21: ideal 78 kg en la semana 4, variación −1,4 kg y avance 35 %', () => {
    const week4 = shiftDate(goal.startDate, 28);
    expect(idealAt(goal, week4)).toBe(78);
    const summary = weightGoalSummary(goal, [{ date: week4, kg: 78.6 }], week4);
    expect(summary).toMatchObject({ changeKg: -1.4, progressPercent: 35, idealToday: 78, comparison: null });
    expect(summary.trend).toEqual([]);
  });

  it('con 3 pesajes calcula un promedio móvil de 7 días y lo compara con la línea ideal', () => {
    const weights = [{ date: '2026-11-02', kg: 80 }, { date: '2026-11-06', kg: 79.4 }, { date: '2026-11-12', kg: 79 }];
    expect(movingAverage(weights).map((point) => Math.round(point.kg * 100) / 100)).toEqual([80, 79.7, 79.2]);
    // Ideal al día 10: 80 − 4 × 10/56 ≈ 79,29; tendencia 79,2 va 0,1 kg por delante (signo positivo = adelantado).
    expect(weightGoalSummary(goal, weights, '2026-11-12').comparison).toBe(0.1);
  });

  it('ignora pesajes fuera del objetivo y limita la línea ideal al plazo', () => {
    const summary = weightGoalSummary(goal, [{ date: '2026-10-01', kg: 90 }], '2026-11-03');
    expect(summary).toMatchObject({ currentKg: 80, changeKg: 0, progressPercent: 0 });
    expect(idealAt(goal, '2027-06-01')).toBe(76);
  });
});
