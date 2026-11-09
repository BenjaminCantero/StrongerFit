import { catalogSlot, dayTargets, generateMealPlan, type FoodRole, type FoodTag, type PlannedMeal } from '@strongerfit/nutrition-engine';
import type { OpenMealPlan, ProfileData } from '../../profile/domain/profile';
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

// Metas por tipo de día (RF-21): solo se ofrecen con un plan de entrenamiento guardado, que
// indica qué días se entrena, y con la meta calculada, que aporta el piso y el gasto total.
export type TrainingDayOption = { available: true; trainingDays: number[] } | { available: false; reason: 'no-training-plan' | 'no-goals' };

export function trainingDayOption(profile: ProfileData): TrainingDayOption {
  const days = profile.trainingPlan?.days.map((day) => day.weekday) ?? [];
  if (!days.length) return { available: false, reason: 'no-training-plan' };
  if (!profile.nutritionPlan) return { available: false, reason: 'no-goals' };
  return { available: true, trainingDays: [...new Set(days)].sort() };
}

function profileDayTargets(profile: ProfileData, targets: Nutrients) {
  const option = trainingDayOption(profile);
  const result = profile.nutritionPlan?.result;
  if (!profile.trainingDayTargets || !option.available || !result) return null;
  return dayTargets({ targets, trainingDays: option.trainingDays, tdee: result.tdee, floor: result.floor,
    noDeficit: hasHealthRisk(profile) || result.warnings.includes('risk-no-deficit') });
}

// Propuesta desde la meta vigente y las restricciones del perfil (CU-05). No se guarda hasta que la persona acepta.
export function proposeMealPlan(profile: ProfileData, targets: Nutrients, now: Date) {
  const result = generateMealPlan({ targets, exclusions: profile.exclusions, dietFocus: profile.dietFocus, preferences: profile.mealPreferences,
    dayTargets: profileDayTargets(profile, targets) });
  return result.ok ? { ...result, plan: { ...result.plan, createdAt: now.toISOString() } as OpenMealPlan } : result;
}

export function mealEntry(meal: Pick<PlannedMeal, 'meal' | 'items' | 'nutrients'>): FoodEntry {
  // El diario tiene cuatro comidas: las colaciones se registran en la once/merienda.
  return { id: 0, meal: catalogSlot[meal.meal], nutrients: meal.nutrients,
    items: meal.items.map(({ foodId, name, grams, nutrients }) => ({ foodId, name, grams, nutrients })) };
}

// Si el perfil declaró riesgo, la meta ya no tiene déficit (BR-19); se informa la derivación.
export const hasHealthRisk = (profile: ProfileData) => !!profile.onboarding?.healthFlags.length;
