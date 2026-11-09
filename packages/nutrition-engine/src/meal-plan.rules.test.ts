import { describe, expect, it } from 'vitest';
import legacy from './fixtures/minuta-0.1.json';
import { foodCatalog } from './foods';
import { nutritionTargets, type TargetInput } from './index';
import {
  applySwap, generateMealPlan, portionLimits, proteinShortfall, proteinWithinTolerance, readMealPlan, swapOptions, withinTolerance,
  type MealPlan, type MealPlanInput,
} from './meal-plan';

const base = { activity: 'moderate', fatShare: 0.25, healthRisk: false } as const;
const man = { ...base, sex: 'male', ageYears: 30, weightKg: 80, heightCm: 180 } as const;
const woman = { ...base, sex: 'female', ageYears: 28, weightKg: 62, heightCm: 163, activity: 'light' } as const;
const directions = [['deficit', 0.15], ['maintenance', 0], ['surplus', 0.1]] as const;

export const goal = (person: Omit<TargetInput, 'direction' | 'adjustment' | 'proteinPerKg'>, direction: TargetInput['direction'], adjustment: number, proteinPerKg = 1.6) => {
  const { kcal, protein, carbs, fat } = nutritionTargets({ ...person, direction, adjustment, proteinPerKg });
  return { kcal, protein, carbs, fat };
};
export const generate = (input: Partial<MealPlanInput> & Pick<MealPlanInput, 'targets'>): MealPlan => {
  const result = generateMealPlan({ exclusions: [], dietFocus: '', ...input });
  if (!result.ok) throw new Error(`sin minuta: ${JSON.stringify(result.blocked)}`);
  return result.plan;
};
const byId = new Map(foodCatalog.map((food) => [food.id, food]));
const items = (plan: MealPlan) => plan.days.flatMap((day) => day.meals.flatMap((meal) => meal.items));

describe('porciones que cuadran proteína y energía', () => {
  for (const [name, person] of [['hombre 80 kg', man], ['mujer 62 kg', woman]] as const) {
    for (const [direction, adjustment] of directions) {
      for (const diet of ['', 'vegetariana']) {
        it(`${name}, ${direction}, ${diet || 'sin restricciones'}: proteína y energía diarias dentro de la tolerancia`, () => {
          const targets = goal(person, direction, adjustment);
          const plan = generate({ targets, dietFocus: diet });
          for (const day of plan.days) {
            expect(proteinWithinTolerance(plan, day), `día ${day.index}: ${day.totals.protein} g de ${targets.protein} g`).toBe(true);
            expect(withinTolerance(plan, day), `día ${day.index}: ${day.totals.kcal} de ${targets.kcal} kcal`).toBe(true);
          }
        });
      }
    }
  }

  it('informa la desviación de proteína de cada día y su tolerancia', () => {
    const targets = goal(man, 'deficit', 0.15);
    const plan = generate({ targets });
    expect(plan.proteinTolerance).toBe(0.1);
    for (const day of plan.days) {
      expect(day.targets).toEqual(targets);
      expect(day.proteinDeviation).toBeCloseTo((day.totals.protein - targets.protein) / targets.protein, 6);
    }
  });

  it('nunca sale de los límites de porción y redondea a 5 g, aunque falte proteína', () => {
    const cases = [
      { targets: goal(man, 'surplus', 0.15, 2) },
      { targets: goal(woman, 'deficit', 0.2, 2), dietFocus: 'vegana' },
      { targets: { kcal: 1200, protein: 150, carbs: 80, fat: 33 }, dietFocus: 'vegana', exclusions: ['soya'] },
    ];
    for (const input of cases) for (const entry of items(generate(input))) {
      const food = byId.get(entry.foodId)!;
      expect(entry.grams % portionLimits.step).toBe(0);
      expect(entry.grams, entry.foodId).toBeGreaterThanOrEqual(food.servingGrams * portionLimits.min - portionLimits.step / 2);
      expect(entry.grams, entry.foodId).toBeLessThanOrEqual(food.servingGrams * portionLimits.max + portionLimits.step / 2);
    }
  });

  it('si las restricciones impiden llegar a la proteína, genera igual, cuadra la energía e indica cuánto falta', () => {
    // Vegana, sin soya, déficit con proteína alta: no hay combinación razonable que cumpla ambas.
    const targets = { kcal: 1400, protein: 130, carbs: 130, fat: 39 };
    const plan = generate({ targets, dietFocus: 'vegana', exclusions: ['soya'] });
    const short = plan.days.filter((day) => !proteinWithinTolerance(plan, day));
    expect(short.length).toBeGreaterThan(0);
    for (const day of short) {
      expect(day.proteinDeviation).toBeLessThan(-plan.proteinTolerance);
      expect(proteinShortfall(day)).toBeCloseTo(targets.protein - day.totals.protein, 1);
    }
    // Prioridad: la energía se mantiene aunque la proteína no llegue.
    expect(plan.days.every((day) => withinTolerance(plan, day))).toBe(true);
  });

  it('el intercambio de un alimento proteico conserva la proteína', () => {
    const plan = generate({ targets: goal(man, 'maintenance', 0) });
    const lunch = plan.days[0]!.meals.find((meal) => meal.meal === 'lunch')!;
    const index = lunch.items.findIndex((entry) => entry.role === 'protein');
    const options = swapOptions(plan, 0, 'lunch', index);
    expect(options.length).toBeGreaterThan(1);
    expect(Math.abs(options[0]!.diff.protein)).toBeLessThanOrEqual(lunch.items[index]!.nutrients.protein * 0.1);
    const swapped = applySwap(plan, 0, 'lunch', index, options[0]!.item);
    expect(swapped.days[0]!.proteinDeviation).toBeCloseTo((swapped.days[0]!.totals.protein - plan.targets.protein) / plan.targets.protein, 6);
  });
});

describe('determinismo y minutas guardadas', () => {
  it('mismo perfil y catálogo producen la misma minuta', () => {
    const input = { targets: goal(woman, 'deficit', 0.15), dietFocus: 'vegetariana', exclusions: ['huevo'] };
    expect(generate(input)).toEqual(generate(input));
  });

  it('abre una minuta guardada con minuta-0.1 sin cambiar sus alimentos y permite intercambiar', () => {
    const stored = legacy as unknown as Parameters<typeof readMealPlan>[0] & { createdAt: string };
    expect(stored.ruleVersion).toBe('minuta-0.1');
    const plan = readMealPlan(stored);
    expect(plan.ruleVersion).toBe('minuta-0.1');
    expect(plan.createdAt).toBe(stored.createdAt);
    expect(plan.days.map((day) => day.meals.map((meal) => meal.items))).toEqual(stored.days.map((day) => day.meals.map((meal) => meal.items)));
    for (const day of plan.days) {
      expect(day.targets).toEqual(stored.targets);
      expect(day.deviation).toBe(stored.days[day.index]!.deviation);
      expect(day.proteinDeviation).toBeCloseTo((day.totals.protein - stored.targets.protein) / stored.targets.protein, 6);
    }
    const options = swapOptions(plan, 2, 'dinner', 0);
    expect(options.length).toBeGreaterThan(0);
    const swapped = applySwap(plan, 2, 'dinner', 0, options[0]!.item);
    expect(swapped.days[2]!.meals.find((meal) => meal.meal === 'dinner')!.items[0]!.foodId).toBe(options[0]!.item.foodId);
    expect(readMealPlan(swapped)).toEqual(swapped);
  });
});
