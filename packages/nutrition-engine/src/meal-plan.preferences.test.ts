import { describe, expect, it } from 'vitest';
import { foodCatalog } from './foods';
import {
  generateMealPlan, isAllowed, MAX_WEEKLY_REPEATS, mealLayouts, MEALS_PER_DAY, normalizePreferences, planNotices, proteinWithinTolerance,
  resolveRestrictions, swapOptions, withinTolerance, type MealPlan,
} from './meal-plan';
import { generate, goal, items, man, woman } from './test-helpers';

const byId = new Map(foodCatalog.map((food) => [food.id, food]));
const count = (plan: MealPlan, id: string) => items(plan).filter((entry) => entry.foodId === id).length;
const swapsOf = (plan: MealPlan) => plan.days.flatMap((day) => day.meals.flatMap((meal) =>
  meal.items.flatMap((_, index) => swapOptions(plan, day.index, meal.meal, index))));

describe('número de comidas al día', () => {
  it('cada reparto suma la meta completa, sin once con 3 y con colaciones con 5 y 6', () => {
    for (const count of MEALS_PER_DAY) {
      const layout = mealLayouts[count];
      expect(layout).toHaveLength(count);
      expect(layout.reduce((total, entry) => total + entry.kcal, 0)).toBeCloseTo(1, 9);
      expect(layout.reduce((total, entry) => total + entry.protein, 0)).toBeCloseTo(1, 9);
    }
    expect(mealLayouts[3].map((entry) => entry.meal)).toEqual(['breakfast', 'lunch', 'dinner']);
    expect(mealLayouts[4].map((entry) => entry.meal)).toEqual(['breakfast', 'lunch', 'snack', 'dinner']);
    expect(mealLayouts[5].map((entry) => entry.meal)).toEqual(['breakfast', 'morning-snack', 'lunch', 'snack', 'dinner']);
    expect(mealLayouts[6].map((entry) => entry.meal)).toEqual(['breakfast', 'morning-snack', 'lunch', 'snack', 'dinner', 'evening-snack']);
  });

  const profiles = [
    ['hombre en déficit', goal(man, 'deficit', 0.15), ''], ['hombre en mantención', goal(man, 'maintenance', 0), ''],
    ['hombre en superávit', goal(man, 'surplus', 0.1), ''], ['mujer en déficit', goal(woman, 'deficit', 0.15), ''],
    ['mujer vegetariana en mantención', goal(woman, 'maintenance', 0), 'vegetariana'],
  ] as const;
  for (const mealsPerDay of MEALS_PER_DAY) {
    for (const [name, targets, dietFocus] of profiles) {
      it(`${mealsPerDay} comidas, ${name}: cada día suma la meta dentro de la tolerancia`, () => {
        const plan = generate({ targets, dietFocus, preferences: { mealsPerDay } });
        expect(plan.preferences.mealsPerDay).toBe(mealsPerDay);
        for (const day of plan.days) {
          expect(day.meals.map((meal) => meal.meal)).toEqual(mealLayouts[mealsPerDay].map((entry) => entry.meal));
          expect(withinTolerance(plan, day), `día ${day.index}: ${day.totals.kcal}/${targets.kcal} kcal`).toBe(true);
          expect(proteinWithinTolerance(plan, day), `día ${day.index}: ${day.totals.protein}/${targets.protein} g`).toBe(true);
        }
      });
    }
  }

  it('las colaciones usan alimentos que el catálogo marca para la once', () => {
    const plan = generate({ targets: goal(man, 'maintenance', 0), preferences: { mealsPerDay: 6 } });
    for (const day of plan.days) for (const meal of day.meals.filter((entry) => entry.meal.endsWith('-snack'))) {
      for (const entry of meal.items) expect(byId.get(entry.foodId)!.meals).toContain('snack');
    }
  });
});

describe('exclusiones por sobre las preferencias', () => {
  it('un alimento excluido nunca aparece aunque esté marcado como preferido, ni en intercambios', () => {
    const excluded = ['eggs', 'usda-172186', 'peanuts', 'peanut-butter', 'chicken', 'salmon', 'greek-yogurt'];
    for (const mealsPerDay of MEALS_PER_DAY) {
      const plan = generate({ targets: goal(man, 'deficit', 0.15), exclusions: ['huevo', 'maní', 'lácteos'], dietFocus: 'vegetariana',
        preferences: { mealsPerDay, preferred: excluded } });
      for (const entry of [...items(plan), ...swapsOf(plan).map((option) => option.item)]) {
        expect(excluded, entry.foodId).not.toContain(entry.foodId);
        expect(isAllowed(byId.get(entry.foodId)!, plan.restrictions)).toBe(true);
      }
      expect(planNotices(plan).filter((notice) => notice.kind === 'preferred-excluded').map((notice) => notice.kind === 'preferred-excluded' && notice.foodId).sort())
        .toEqual([...excluded].sort());
    }
  });

  it('cuando faltan opciones, recurre a lo que no le gusta pero nunca a lo excluido', () => {
    // Todas las frutas no gustan y una parte está además excluida por nombre.
    const fruits = foodCatalog.filter((food) => food.role === 'fruit' && food.verified);
    const excluded = fruits.slice(0, 20).map((food) => food.name);
    const plan = generate({ targets: goal(woman, 'maintenance', 0), exclusions: excluded,
      preferences: { preferred: fruits.slice(0, 20).map((food) => food.id), disliked: fruits.map((food) => food.id) } });
    const restrictions = resolveRestrictions(excluded, '');
    for (const entry of [...items(plan), ...swapsOf(plan).map((option) => option.item)]) {
      expect(isAllowed(byId.get(entry.foodId)!, restrictions), entry.foodId).toBe(true);
    }
    // Con un catálogo donde el único lácteo compatible está excluido, se bloquea en lugar de usarlo.
    const foods = foodCatalog.filter((food) => food.role !== 'fruit' || food.id === 'banana');
    const blocked = generateMealPlan({ targets: goal(woman, 'maintenance', 0), exclusions: ['plátano'], dietFocus: '', foods,
      preferences: { preferred: ['banana'] } });
    expect(blocked).toMatchObject({ ok: false, blocked: [{ meal: 'breakfast', role: 'fruit' }, { meal: 'snack', role: 'fruit' }] });
  });
});

describe('alimentos preferidos', () => {
  it('un preferido aparece más que sin preferencias, sin superar el tope semanal ni repetirse en días seguidos', () => {
    const targets = goal(man, 'maintenance', 0);
    const before = count(generate({ targets }), 'chicken');
    const plan = generate({ targets, preferences: { preferred: ['chicken'] } });
    const after = count(plan, 'chicken');
    expect(after).toBeGreaterThan(before);
    expect(after).toBeLessThanOrEqual(MAX_WEEKLY_REPEATS);
    const days = plan.days.filter((day) => day.meals.some((meal) => meal.items.some((entry) => entry.foodId === 'chicken'))).map((day) => day.index);
    expect(days.length).toBeLessThan(7);
    for (let index = 1; index < days.length; index++) expect(days[index]! - days[index - 1]!).toBeGreaterThan(1);
  });

  it('con varios preferidos ninguno supera el tope y todos aparecen', () => {
    const preferred = ['chicken', 'salmon', 'rice', 'banana', 'greek-yogurt', 'avocado'];
    for (const mealsPerDay of MEALS_PER_DAY) {
      const plan = generate({ targets: goal(woman, 'deficit', 0.15), preferences: { mealsPerDay, preferred } });
      for (const id of preferred) {
        const times = count(plan, id);
        expect(times, `${mealsPerDay} comidas, ${id}`).toBeLessThanOrEqual(MAX_WEEKLY_REPEATS);
      }
      expect(preferred.filter((id) => count(plan, id) > 0).length).toBeGreaterThanOrEqual(5);
    }
  });

  it('los intercambios ponen primero los preferidos compatibles', () => {
    const plan = generate({ targets: goal(man, 'maintenance', 0), preferences: { preferred: ['turkey'] } });
    const day = plan.days.find((value) => !value.meals.some((meal) => meal.items.some((entry) => entry.foodId === 'turkey')))!;
    const lunch = day.meals.find((meal) => meal.meal === 'lunch')!;
    const options = swapOptions(plan, day.index, 'lunch', lunch.items.findIndex((entry) => entry.role === 'protein'));
    expect(options[0]).toMatchObject({ preferred: true, item: { foodId: 'turkey' } });
  });
});

describe('alimentos que no le gustan', () => {
  const targets = goal(man, 'deficit', 0.15);

  it('no aparecen si hay alternativas, ni en la minuta ni en los intercambios', () => {
    const disliked = ['chicken', 'turkey', 'tuna', 'rice', 'banana', 'apple', 'greek-yogurt', 'milk', 'avocado', 'olive-oil'];
    for (const mealsPerDay of MEALS_PER_DAY) {
      const plan = generate({ targets, preferences: { mealsPerDay, disliked } });
      for (const entry of [...items(plan), ...swapsOf(plan).map((option) => option.item)]) expect(disliked).not.toContain(entry.foodId);
      expect(planNotices(plan).some((notice) => notice.kind === 'disliked-used')).toBe(false);
    }
  });

  it('aparecen con aviso cuando no hay alternativas compatibles', () => {
    const fruits = foodCatalog.filter((food) => food.role === 'fruit').map((food) => food.id);
    const plan = generate({ targets, preferences: { disliked: fruits } });
    const used = items(plan).filter((entry) => fruits.includes(entry.foodId));
    expect(used.length).toBeGreaterThan(0);
    const notices = planNotices(plan).filter((notice) => notice.kind === 'disliked-used');
    expect(notices.map((notice) => notice.kind === 'disliked-used' && notice.foodId).sort()).toEqual([...new Set(used.map((entry) => entry.foodId))].sort());
    for (const notice of notices) if (notice.kind === 'disliked-used') {
      expect(notice.meals.every(({ meal }) => meal === 'breakfast' || meal === 'snack')).toBe(true);
    }
    // En el intercambio también se ofrecen, marcados, porque no hay otra opción.
    const breakfast = plan.days[0]!.meals[0]!;
    const options = swapOptions(plan, 0, 'breakfast', breakfast.items.findIndex((entry) => entry.role === 'fruit'));
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((option) => option.disliked)).toBe(true);
  });

  it('si todo el rol no le gusta, prueba antes el rol de respaldo', () => {
    const dairy = foodCatalog.filter((food) => food.role === 'dairy').map((food) => food.id);
    const plan = generate({ targets, preferences: { disliked: dairy } });
    expect(items(plan).some((entry) => dairy.includes(entry.foodId))).toBe(false);
  });
});

describe('preferencias canónicas', () => {
  const targets = goal(woman, 'maintenance', 0);

  it('descarta IDs desconocidos y no verificados, ordena y resuelve conflictos a favor de «no me gusta»', () => {
    expect(normalizePreferences({ mealsPerDay: 7 as never, preferred: ['rice', 'chicken', 'rice', 'nada', 'bread'], disliked: ['rice'] }))
      .toEqual({ mealsPerDay: 4, preferred: ['chicken'], disliked: ['rice'] });
    expect(normalizePreferences()).toEqual({ mealsPerDay: 4, preferred: [], disliked: [] });
  });

  it('la generación con preferencias es determinista', () => {
    const input = { targets, preferences: { mealsPerDay: 5 as const, preferred: ['salmon', 'quinoa'], disliked: ['tuna'] } };
    expect(generate(input)).toEqual(generate(input));
  });
});
