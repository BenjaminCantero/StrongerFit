import { describe, expect, it } from 'vitest';
import { dayTargets, energyFloor, limits, nutritionTargets, TRAINING_REST_GAP, type TargetInput } from './index';
import { planNotices, proteinWithinTolerance, readMealPlan, withinTolerance } from './meal-plan';
import { generate, man, woman } from './test-helpers';

const goals = (person: Omit<TargetInput, 'direction' | 'adjustment' | 'proteinPerKg'>, direction: TargetInput['direction'], adjustment: number) =>
  nutritionTargets({ ...person, direction, adjustment, proteinPerKg: 1.6 });
const input = (result: ReturnType<typeof goals>, trainingDays: number[], noDeficit = false) => ({
  targets: { kcal: result.kcal, protein: result.protein, carbs: result.carbs, fat: result.fat }, trainingDays, tdee: result.tdee, floor: result.floor, noDeficit,
});
const weekly = (days: { targets: { kcal: number } }[]) => days.reduce((total, day) => total + day.targets.kcal, 0);
const schedules = [[0, 3], [0, 2, 4], [0, 1, 3, 4], [0, 1, 2, 4, 5], [0, 1, 2, 3, 4, 5]];

describe('metas por tipo de día (RF-21)', () => {
  const profiles = [
    ['hombre en mantención', goals(man, 'maintenance', 0)], ['hombre en superávit', goals(man, 'surplus', 0.15)],
    ['hombre en déficit', goals(man, 'deficit', 0.1)], ['mujer en déficit', goals(woman, 'deficit', 0.15)],
    ['mujer en el piso', goals({ ...woman, ageYears: 50, weightKg: 50, heightCm: 155, activity: 'sedentary' }, 'deficit', 0.2)],
  ] as const;

  for (const [name, result] of profiles) for (const trainingDays of schedules) {
    it(`${name}, ${trainingDays.length} días de entrenamiento: promedio exacto y ningún día bajo el piso ni fuera de los límites`, () => {
      const value = dayTargets(input(result, trainingDays));
      expect(weekly(value.days)).toBe(result.kcal * 7);
      for (const day of value.days) {
        expect(day.targets.kcal).toBeGreaterThanOrEqual(result.floor);
        expect(day.targets.kcal).toBeGreaterThanOrEqual(Math.round(result.tdee * (1 - limits.deficit.max)));
        expect(day.targets.kcal).toBeLessThanOrEqual(Math.round(result.tdee * (1 + limits.surplus.max)));
        expect(day.targets).toMatchObject({ protein: result.protein, fat: result.fat });
        expect(day.type).toBe(trainingDays.includes(value.days.indexOf(day)) ? 'training' : 'rest');
      }
      expect(value.gap).toBeLessThanOrEqual(TRAINING_REST_GAP);
    });
  }

  it('da más energía y carbohidratos al entrenar, con la diferencia fija documentada', () => {
    const result = goals(man, 'maintenance', 0);
    const value = dayTargets(input(result, [0, 2, 4]));
    expect(value).toMatchObject({ requestedGap: 0.1, gap: 0.1, reduced: false });
    const training = value.days[0]!.targets;
    const rest = value.days[1]!.targets;
    expect(training.kcal - rest.kcal).toBeCloseTo(result.kcal * 0.1, -1);
    expect(training.carbs).toBeGreaterThan(result.carbs);
    expect(rest.carbs).toBeLessThan(result.carbs);
    expect((training.carbs - result.carbs) * 4).toBeCloseTo(training.kcal - result.kcal, -1);
  });

  it('reduce la diferencia en lugar de bajar del piso, y lo informa', () => {
    const atFloor = goals({ ...woman, ageYears: 50, weightKg: 50, heightCm: 155, activity: 'sedentary' }, 'deficit', 0.2);
    expect(atFloor.kcal).toBe(energyFloor('female'));
    const value = dayTargets(input(atFloor, [0, 2, 4]));
    expect(value).toMatchObject({ gap: 0, reduced: true });
    expect(value.days.every((day) => day.targets.kcal === atFloor.kcal)).toBe(true);
    // Déficit del 15 % con cinco días de entrenamiento: el descanso solo puede bajar hasta el 20 %.
    const deficit = goals(man, 'deficit', 0.15);
    const partial = dayTargets(input(deficit, [0, 1, 2, 3, 4]));
    expect(partial.reduced).toBe(true);
    expect(partial.gap).toBeGreaterThan(0);
    expect(partial.gap).toBeLessThan(TRAINING_REST_GAP);
    expect(Math.min(...partial.days.map((day) => day.targets.kcal))).toBeGreaterThanOrEqual(Math.round(deficit.tdee * 0.8));
  });

  it('con riesgo declarado ningún día de descanso queda en déficit', () => {
    const risk = nutritionTargets({ ...man, direction: 'deficit', adjustment: 0.15, proteinPerKg: 1.6, healthRisk: true });
    const value = dayTargets(input(risk, [0, 2, 4], true));
    expect(value.days.every((day) => day.targets.kcal >= risk.tdee)).toBe(true);
    expect(weekly(value.days)).toBe(risk.kcal * 7);
  });

  it('sin días de entrenamiento o entrenando todos los días no hay diferencia', () => {
    const result = goals(man, 'maintenance', 0);
    for (const days of [[], [0, 1, 2, 3, 4, 5, 6], [9, -1]]) {
      const value = dayTargets(input(result, days));
      expect(value.days.every((day) => day.targets.kcal === result.kcal)).toBe(true);
      expect(value.reduced).toBe(false);
    }
  });

  it('la minuta usa la meta de cada día, mantiene el promedio y cada día queda en tolerancia', () => {
    for (const [result, trainingDays, mealsPerDay] of [[goals(man, 'surplus', 0.1), [0, 2, 4], 4], [goals(woman, 'maintenance', 0), [0, 1, 3, 4], 5],
      [goals(man, 'deficit', 0.1), [1, 3, 5], 3]] as const) {
      const days = dayTargets(input(result, [...trainingDays]));
      const plan = generate({ targets: input(result, []).targets, dayTargets: days, preferences: { mealsPerDay } });
      expect(plan.dayTypes).toEqual({ requestedGap: days.requestedGap, gap: days.gap, reduced: days.reduced });
      expect(weekly(plan.days)).toBe(result.kcal * 7);
      for (const day of plan.days) {
        expect(day.type).toBe(days.days[day.index]!.type);
        expect(day.targets).toEqual(days.days[day.index]!.targets);
        expect(day.deviation).toBeCloseTo((day.totals.kcal - day.targets.kcal) / day.targets.kcal, 6);
        expect(withinTolerance(plan, day)).toBe(true);
        expect(proteinWithinTolerance(plan, day)).toBe(true);
      }
      const training = plan.days.filter((day) => day.type === 'training');
      const rest = plan.days.filter((day) => day.type === 'rest');
      expect(Math.min(...training.map((day) => day.totals.kcal))).toBeGreaterThan(Math.max(...rest.map((day) => day.totals.kcal)) - result.kcal * 0.1);
      expect(readMealPlan(plan)).toEqual(plan);
    }
  });

  it('desactivada por defecto: sin metas por día la minuta no marca tipos', () => {
    const plan = generate({ targets: { kcal: 2100, protein: 130, carbs: 230, fat: 65 } });
    expect(plan.dayTypes).toBeNull();
    expect(plan.days.every((day) => day.type === null)).toBe(true);
  });

  it('avisa cuando la diferencia se redujo por el piso o los límites', () => {
    const deficit = goals(man, 'deficit', 0.15);
    const days = dayTargets(input(deficit, [0, 1, 2, 3, 4]));
    const plan = generate({ targets: input(deficit, []).targets, dayTargets: days });
    expect(planNotices(plan)).toContainEqual({ kind: 'day-gap-reduced', gap: days.gap, requestedGap: 0.1 });
  });
});
