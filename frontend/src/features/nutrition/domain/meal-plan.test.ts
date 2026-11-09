import { describe, expect, it } from 'vitest';
import { createProfilePreview } from '../../profile/data/profile.preview';
import { profileReducer } from '../../profile/domain/profile';
import { calculateGoals, defaultSettings, goalPerson } from './goals';
import { mealEntry, noticeText, preferenceOptions, proposeMealPlan, trainingDayOption, weekdayIndex } from './meal-plan';

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

  it('usa las preferencias del perfil y registra las colaciones en la once', () => {
    const profile = { ...createProfilePreview(), mealPreferences: { mealsPerDay: 6 as const, preferred: ['salmon'], disliked: ['tuna'] } };
    const result = proposeMealPlan(profile, targets, new Date());
    if (!result.ok) throw new Error('sin minuta');
    expect(result.plan.preferences).toEqual(profile.mealPreferences);
    const meals = result.plan.days[0]!.meals;
    expect(meals.map((meal) => meal.meal)).toEqual(['breakfast', 'morning-snack', 'lunch', 'snack', 'dinner', 'evening-snack']);
    expect(mealEntry(meals[1]!).meal).toBe('snack');
    expect(mealEntry(meals[5]!).meal).toBe('snack');
    expect(result.plan.days.some((day) => day.meals.some((meal) => meal.items.some((item) => item.foodId === 'salmon')))).toBe(true);
    expect(result.plan.days.some((day) => day.meals.some((meal) => meal.items.some((item) => item.foodId === 'tuna')))).toBe(false);
  });

  it('metas por tipo de día: desactivadas por defecto, solo con plan de entrenamiento y con el promedio de la meta', () => {
    const preview = createProfilePreview();
    const person = goalPerson(preview);
    if (!person.ok) throw new Error('sin datos');
    const settings = defaultSettings(preview);
    const result = calculateGoals(person.person, settings);
    const profile = { ...preview, nutritionPlan: { proteinPerKg: settings.proteinPerKg, fatShare: settings.fatShare, result, savedAt: '' } };
    const goal = { kcal: result.kcal, protein: result.protein, carbs: result.carbs, fat: result.fat };
    const off = proposeMealPlan(profile, goal, new Date());
    expect(off.ok && off.plan.dayTypes).toBeNull();

    const option = trainingDayOption(profile);
    expect(option).toEqual({ available: true, trainingDays: [...new Set(profile.trainingPlan!.days.map((day) => day.weekday))].sort() });
    const on = proposeMealPlan({ ...profile, trainingDayTargets: true }, goal, new Date());
    if (!on.ok || !option.available) throw new Error('sin minuta');
    expect(on.plan.days.map((day) => day.type)).toEqual(on.plan.days.map((day) => option.trainingDays.includes(day.index) ? 'training' : 'rest'));
    expect(on.plan.days.reduce((total, day) => total + day.targets.kcal, 0)).toBe(goal.kcal * 7);
    expect(on.plan.days.every((day) => day.targets.kcal >= result.floor)).toBe(true);

    expect(trainingDayOption({ ...profile, trainingPlan: null })).toEqual({ available: false, reason: 'no-training-plan' });
    expect(trainingDayOption({ ...profile, nutritionPlan: null })).toEqual({ available: false, reason: 'no-goals' });
    const withoutPlan = proposeMealPlan({ ...profile, trainingPlan: null, trainingDayTargets: true }, goal, new Date());
    expect(withoutPlan.ok && withoutPlan.plan.dayTypes).toBeNull();
  });

  it('el buscador de preferencias ofrece solo verificados y marca lo que bloquean las exclusiones', () => {
    const options = preferenceOptions('pollo', [], '');
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((option) => option.food.verified && !option.excluded)).toBe(true);
    expect(preferenceOptions('pechuga de pollo', [], 'vegetariana').every((option) => option.excluded)).toBe(true);
    expect(preferenceOptions('marraqueta', [], '')).toEqual([]);
    expect(preferenceOptions('  ', [], '')).toEqual([]);
  });

  it('explica cada aviso con lo que falta y por qué', () => {
    expect(noticeText({ kind: 'protein-short', day: 2, missing: 12.4 })).toMatch(/^Faltan 12 g de proteína/);
    expect(noticeText({ kind: 'disliked-used', foodId: 'apple', name: 'Manzana', meals: [{ day: 0, meal: 'breakfast' }, { day: 1, meal: 'morning-snack' }] }))
      .toBe('Usamos Manzana, que marcaste como «no me gusta», en desayuno del lunes y colación de media mañana del martes: tus exclusiones no dejan otra opción compatible para ese casillero.');
    expect(noticeText({ kind: 'preferred-excluded', foodId: 'eggs', name: 'Huevo' })).toMatch(/tus exclusiones lo bloquean/);
    expect(noticeText({ kind: 'day-gap-reduced', gap: 0.082, requestedGap: 0.1 })).toMatch(/quedó en 8,2 % \(en vez de 10 %\)/);
    expect(noticeText({ kind: 'day-gap-reduced', gap: 0, requestedGap: 0.1 })).toMatch(/misma meta/);
  });

  it('usa lunes como primer día', () => {
    expect(weekdayIndex('2026-11-02')).toBe(0);
    expect(weekdayIndex('2026-11-01')).toBe(6);
  });
});
