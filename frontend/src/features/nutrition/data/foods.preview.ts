import { foodCatalog } from '@strongerfit/nutrition-engine';
import type { Food } from '../domain/food-entry';

// Catálogo importado del motor; conserva los alimentos propios explícitamente no verificados.
export const foodsPreview: Food[] = foodCatalog;
