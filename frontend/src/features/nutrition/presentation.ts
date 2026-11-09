import type { PlanSlot } from '@strongerfit/nutrition-engine';
import type { MealId } from './domain/food-entry';

export const mealLabels: Record<MealId, string> = {
  breakfast: 'Desayuno', lunch: 'Almuerzo', snack: 'Once / Merienda', dinner: 'Cena',
};
// Comidas de la minuta: las del diario más las colaciones.
export const planMealLabels: Record<PlanSlot, string> = {
  ...mealLabels, 'morning-snack': 'Colación de media mañana', 'evening-snack': 'Colación nocturna',
};
export const formatKcal = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format;
export const formatGrams = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format;
export const formatMacro = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format;

export function formatDiaryDate(date: string): string {
  const formatted = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
