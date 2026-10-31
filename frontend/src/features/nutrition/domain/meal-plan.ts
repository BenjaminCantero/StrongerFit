import { generateMealPlan, type FoodRole, type FoodTag, type PlannedMeal } from '@strongerfit/nutrition-engine';
import type { ProfileData, SavedMealPlan } from '../../profile/domain/profile';
import type { FoodEntry, Nutrients } from './food-entry';

export const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const roleLabels: Record<FoodRole, string> = {
  protein: 'Proteína', dairy: 'Lácteo o similar', carb: 'Carbohidrato', veg: 'Verdura', fruit: 'Fruta', fat: 'Grasa saludable',
};
export const tagLabels: Record<FoodTag, string> = {
  gluten: 'Sin gluten', lactosa: 'Sin lactosa', lacteo: 'Sin lácteos', 'frutos-secos': 'Sin frutos secos', mani: 'Sin maní', huevo: 'Sin huevo',
  pescado: 'Sin pescado', mariscos: 'Sin mariscos', soya: 'Sin soya', carne: 'Sin carne', animal: 'Sin productos animales',
};

// Lunes = 0, como la minuta.
export const weekdayIndex = (date: string) => (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;

// Propuesta desde la meta vigente y las restricciones del perfil (CU-05). No se guarda hasta que la persona acepta.
export function proposeMealPlan(profile: ProfileData, targets: Nutrients, now: Date) {
  const result = generateMealPlan({ targets, exclusions: profile.exclusions, dietFocus: profile.dietFocus });
  return result.ok ? { ...result, plan: { ...result.plan, createdAt: now.toISOString() } as SavedMealPlan } : result;
}

export function mealEntry(meal: PlannedMeal): FoodEntry {
  return { id: 0, meal: meal.meal, nutrients: meal.nutrients,
    items: meal.items.map(({ foodId, name, grams, nutrients }) => ({ foodId, name, grams, nutrients })) };
}

// Si el perfil declaró riesgo, la meta ya no tiene déficit (BR-19); se informa la derivación.
export const hasHealthRisk = (profile: ProfileData) => !!profile.onboarding?.healthFlags.length;
