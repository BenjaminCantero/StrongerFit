import type { MealPlan, NutritionTargets } from '@strongerfit/nutrition-engine';
import { createEmptyProfile } from '../../profile/domain/profile';
import { proposeMealPlan } from '../domain/meal-plan';

// Minuta real para pruebas: misma función que usa la pantalla de minuta.
export function proposeMealPlanForTest(result: Pick<NutritionTargets, 'kcal' | 'protein' | 'carbs' | 'fat'>): MealPlan {
  const proposal = proposeMealPlan(createEmptyProfile(), { kcal: result.kcal, protein: result.protein, carbs: result.carbs, fat: result.fat },
    new Date('2026-11-26T12:00:00Z'));
  if (!proposal.ok) throw new Error('no se pudo generar la minuta de prueba');
  const { createdAt: _createdAt, ...plan } = proposal.plan;
  return plan;
}
