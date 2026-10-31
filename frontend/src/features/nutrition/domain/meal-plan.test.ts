import { describe, expect, it } from 'vitest';
import { createProfilePreview } from '../../profile/data/profile.preview';
import { profileReducer } from '../../profile/domain/profile';
import { mealEntry, proposeMealPlan, weekdayIndex } from './meal-plan';

const targets = { kcal: 2100, protein: 130, carbs: 220, fat: 60 };

describe('minuta en la app', () => {
  it('propone con las exclusiones del perfil y se guarda solo al aceptar', () => {
    const profile = createProfilePreview(); // excluye gluten
    const result = proposeMealPlan(profile, targets, new Date('2026-10-31T12:00:00Z'));
    if (!result.ok) throw new Error('sin minuta');
    expect(result.plan.restrictions.tags).toEqual(['gluten']);
    expect(result.plan.createdAt).toBe('2026-10-31T12:00:00.000Z');
    expect(profile.mealPlan).toBeNull();
    expect(profileReducer(profile, { type: 'set-meal-plan', plan: result.plan }).mealPlan).toBe(result.plan);
  });

  it('convierte una comida de la minuta en un registro del diario', () => {
    const result = proposeMealPlan(createProfilePreview(), targets, new Date());
    if (!result.ok) throw new Error('sin minuta');
    const meal = result.plan.days[0]!.meals[1]!;
    const entry = mealEntry(meal);
    expect(entry).toMatchObject({ meal: 'lunch', nutrients: meal.nutrients });
    expect(entry.items.map((item) => item.foodId)).toEqual(meal.items.map((item) => item.foodId));
  });

  it('usa lunes como primer día', () => {
    expect(weekdayIndex('2026-11-02')).toBe(0);
    expect(weekdayIndex('2026-11-01')).toBe(6);
  });
});
