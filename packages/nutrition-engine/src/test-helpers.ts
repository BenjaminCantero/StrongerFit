import { nutritionTargets, type TargetInput } from './index';
import { generateMealPlan, type MealPlan, type MealPlanInput } from './meal-plan';

// Perfiles típicos de prueba sobre el catálogo real.
export const man = { sex: 'male', ageYears: 30, weightKg: 80, heightCm: 180, activity: 'moderate', fatShare: 0.25, healthRisk: false } as const;
export const woman = { sex: 'female', ageYears: 28, weightKg: 62, heightCm: 163, activity: 'light', fatShare: 0.25, healthRisk: false } as const;

export const goal = (person: Omit<TargetInput, 'direction' | 'adjustment' | 'proteinPerKg'>, direction: TargetInput['direction'], adjustment: number, proteinPerKg = 1.6) => {
  const { kcal, protein, carbs, fat } = nutritionTargets({ ...person, direction, adjustment, proteinPerKg });
  return { kcal, protein, carbs, fat };
};

export const generate = (input: Partial<MealPlanInput> & Pick<MealPlanInput, 'targets'>): MealPlan => {
  const result = generateMealPlan({ exclusions: [], dietFocus: '', ...input });
  if (!result.ok) throw new Error(`sin minuta: ${JSON.stringify(result.blocked)}`);
  return result.plan;
};

export const items = (plan: MealPlan) => plan.days.flatMap((day) => day.meals.flatMap((meal) => meal.items));
