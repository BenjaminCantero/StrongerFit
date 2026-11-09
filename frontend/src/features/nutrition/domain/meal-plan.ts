import { catalogSlot, dayTargets, foodCatalog, generateMealPlan, isAllowed, resolveRestrictions, type CatalogFood, type FoodRole, type FoodTag,
  type PlanNotice, type PlannedMeal, type PlanSlot } from '@strongerfit/nutrition-engine';
import { formatKcal, formatMacro, planMealLabels } from '../presentation';
import { searchFoods } from './food-entry';
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

// Buscador de preferencias: solo alimentos verificados, que son los que la minuta usa. Los que
// bloquean las exclusiones actuales se marcan: una exclusión siempre gana a una preferencia.
export type PreferenceOption = { food: CatalogFood; excluded: boolean };
export const PREFERENCE_RESULTS = 8;

export function preferenceOptions(query: string, exclusions: string[], dietFocus: string, foods = foodCatalog): PreferenceOption[] {
  if (!query.trim()) return [];
  const restrictions = resolveRestrictions(exclusions, dietFocus, foods);
  return searchFoods(foods.filter((food) => food.verified), query).slice(0, PREFERENCE_RESULTS)
    .map((food) => ({ food, excluded: !isAllowed(food, restrictions) }));
}

// Textos de los avisos de la minuta (planNotices del motor).
const mealsText = (meals: { day: number; meal: PlanSlot }[]) => {
  const named = meals.slice(0, 3).map(({ day, meal }) => `${planMealLabels[meal].toLowerCase()} del ${weekDays[day]!.toLowerCase()}`);
  return meals.length > 3 ? `${named.join(', ')} y ${meals.length - 3} más` : named.join(', ').replace(/, ([^,]*)$/, ' y $1');
};

export function noticeText(notice: PlanNotice): string {
  switch (notice.kind) {
    case 'protein-short':
      return `Faltan ${formatKcal(notice.missing)} g de proteína para la meta de este día. Con tus restricciones no encontramos porciones razonables que la cubran; puedes cambiar un alimento por otro más proteico.`;
    case 'disliked-used':
      return `Usamos ${notice.name}, que marcaste como «no me gusta», en ${mealsText(notice.meals)}: tus exclusiones no dejan otra opción compatible para ese casillero.`;
    case 'preferred-excluded':
      return `${notice.name} está en tus preferidos, pero tus exclusiones lo bloquean. No lo incluimos.`;
    case 'day-gap-reduced':
      return notice.gap === 0
        ? 'No pudimos dar más energía a los días de entrenamiento sin que los de descanso bajaran de tu piso de energía o del déficit máximo. Todos los días tienen la misma meta.'
        : `La diferencia entre días de entrenamiento y descanso quedó en ${formatMacro(notice.gap * 100)} % (en vez de ${Math.round(notice.requestedGap * 100)} %) para que ningún día de descanso baje de tu piso de energía ni del déficit máximo.`;
  }
}
