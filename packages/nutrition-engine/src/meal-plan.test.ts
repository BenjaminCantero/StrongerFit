import { describe, expect, it } from 'vitest';
import { foodCatalog } from './foods';
import { applySwap, generateMealPlan, resolveRestrictions, swapOptions } from './meal-plan';

const targets = { kcal: 2100, protein: 130, carbs: 230, fat: 65 };
const plan = (exclusions: string[] = [], dietFocus = '') => {
  const result = generateMealPlan({ targets, exclusions, dietFocus });
  if (!result.ok) throw new Error('sin minuta');
  return result.plan;
};
const foodsIn = (value: ReturnType<typeof plan>) => value.days.flatMap((day) => day.meals.flatMap((meal) => meal.items))
  .map((item) => foodCatalog.find((food) => food.id === item.foodId)!);

describe('minuta semanal', () => {
  it('arma 7 días con 4 comidas, versionada y determinista', () => {
    const first = plan();
    expect(first.days).toHaveLength(7);
    expect(first.days.every((day) => day.meals.map((meal) => meal.meal).join() === 'breakfast,lunch,snack,dinner')).toBe(true);
    expect(first).toMatchObject({ ruleVersion: 'minuta-0.1', catalogVersion: 'alimentos-referencia-0.1', tolerance: 0.1 });
    expect(plan()).toEqual(first);
  });

  it('mantiene la energía diaria dentro de la tolerancia en la mayoría de los días y reporta la desviación', () => {
    const days = plan().days;
    expect(days.filter((day) => Math.abs(day.deviation) <= 0.1).length).toBeGreaterThanOrEqual(5);
    for (const day of days) expect(day.deviation).toBeCloseTo((day.totals.kcal - 2100) / 2100, 6);
  });

  it('CA-05: ningún alimento con alérgeno excluido aparece en la minuta', () => {
    const result = foodsIn(plan(['Gluten', 'lácteos', 'nueces', 'maní']));
    expect(result.some((food) => food.tags.some((tag) => ['gluten', 'lactosa', 'lacteo', 'frutos-secos', 'mani'].includes(tag)))).toBe(false);
  });

  it('respeta dietas vegetariana y vegana y no repite la proteína del almuerzo en la cena', () => {
    expect(foodsIn(plan([], 'Vegetariana')).some((food) => food.tags.includes('carne') || food.tags.includes('pescado'))).toBe(false);
    expect(foodsIn(plan([], 'vegana')).some((food) => food.tags.includes('animal'))).toBe(false);
    for (const day of plan().days) {
      const protein = (meal: string) => day.meals.find((item) => item.meal === meal)!.items.find((item) => item.role === 'protein')!.foodId;
      expect(protein('lunch')).not.toBe(protein('dinner'));
    }
  });

  it('«lácteos» excluye también lo sin lactosa; «lactosa» permite lácteos sin lactosa', () => {
    expect(resolveRestrictions(['Lácteos'], '').tags).toEqual(['lactosa', 'lacteo']);
    const lactose = foodsIn(plan(['intolerancia a la lactosa']));
    expect(lactose.some((food) => food.tags.includes('lactosa'))).toBe(false);
  });

  it('distingue alérgenos conocidos, nombres de alimentos y exclusiones no reconocidas', () => {
    expect(resolveRestrictions(['Gluten', 'brócoli', 'cilantro'], '')).toEqual({ tags: ['gluten'], names: ['brocoli'], unmatched: ['cilantro'], diet: null });
  });

  it('informa qué bloquea la minuta cuando las restricciones no dejan opciones, sin ignorarlas', () => {
    const result = generateMealPlan({ targets, exclusions: ['soya', 'gluten'], dietFocus: 'vegana' });
    expect(result.ok).toBe(true);
    const blocked = generateMealPlan({ targets, exclusions: ['plátano', 'manzana', 'naranja', 'frutillas', 'kiwi'], dietFocus: '' });
    expect(blocked).toMatchObject({ ok: false, blocked: [{ meal: 'breakfast', role: 'fruit' }, { meal: 'snack', role: 'fruit' }] });
  });

  it('deja al menos dos opciones por casillero con exclusiones comunes, para que siempre haya intercambio', () => {
    for (const [exclusions, diet] of [[['gluten'], ''], [['lactosa'], ''], [['lácteos'], ''], [['huevo'], ''], [['frutos secos', 'maní'], ''], [[], 'vegetariana']] as const) {
      const value = plan([...exclusions], diet);
      for (const meal of value.days[0]!.meals) meal.items.forEach((_, index) =>
        expect(swapOptions(value, 0, meal.meal, index).length, `${exclusions} ${diet} ${meal.meal} ${index}`).toBeGreaterThanOrEqual(2));
    }
  });

  it('intercambia un alimento por otro del mismo rol con energía similar y muestra la diferencia', () => {
    const base = plan(['gluten']);
    const options = swapOptions(base, 0, 'lunch', 0);
    expect(options.length).toBeGreaterThan(0);
    const current = base.days[0]!.meals[1]!.items[0]!;
    expect(options.every((option) => option.item.role === 'protein' && option.item.foodId !== current.foodId)).toBe(true);
    expect(Math.abs(options[0]!.diff.kcal)).toBeLessThan(current.nutrients.kcal * 0.15);
    const swapped = applySwap(base, 0, 'lunch', 0, options[0]!.item);
    expect(swapped.days[0]!.meals[1]!.items[0]!.foodId).toBe(options[0]!.item.foodId);
    expect(swapped.days[0]!.totals.kcal).toBeCloseTo(base.days[0]!.totals.kcal + options[0]!.diff.kcal, 0);
    expect(swapped.days[1]).toBe(base.days[1]);
  });
});
