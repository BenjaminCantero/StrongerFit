import { sumNutrients, type FoodEntry, type MealId, type Nutrients } from './food-entry';

// Alimento reconocido en una foto. Los valores por 100 g vienen del analizador
// (o del catálogo al que este los asocie); los gramos son una estimación editable.
export type DetectedFood = {
  id: string;
  name: string;
  grams: number;
  per100g: Nutrients;
  confidence: number;
};
export type PhotoAnalysis = { items: DetectedFood[]; source: string };

export type PhotoMealPhase = 'idle' | 'ready' | 'analyzing' | 'review' | 'error';
export type PhotoMealState = {
  phase: PhotoMealPhase;
  photoUri: string | null;
  meal: MealId;
  items: DetectedFood[];
  source: string | null;
  error: string | null;
  // Cada foto o reintento invalida respuestas anteriores que lleguen tarde.
  requestId: number;
};
export type PhotoMealAction =
  | { type: 'photo-selected'; uri: string }
  | { type: 'analysis-started' }
  | { type: 'analysis-succeeded'; requestId: number; analysis: PhotoAnalysis }
  | { type: 'analysis-failed'; requestId: number; message: string }
  | { type: 'adjust-grams'; id: string; delta: number }
  | { type: 'remove-item'; id: string }
  | { type: 'select-meal'; meal: MealId }
  | { type: 'reset' };

export const LOW_CONFIDENCE = 0.6;
export const MAX_ITEM_GRAMS = 2000;
const MIN_ITEM_GRAMS = 5;

export function createPhotoMeal(meal: MealId = 'lunch'): PhotoMealState {
  return { phase: 'idle', photoUri: null, meal, items: [], source: null, error: null, requestId: 0 };
}

function validItem(item: DetectedFood): boolean {
  return !!item.name.trim() && Number.isFinite(item.grams) && item.grams > 0
    && Number.isFinite(item.confidence) && item.confidence >= 0 && item.confidence <= 1
    && Object.values(item.per100g).every((value) => Number.isFinite(value) && value >= 0);
}

const clampGrams = (grams: number) => Math.min(MAX_ITEM_GRAMS, Math.max(MIN_ITEM_GRAMS, Math.round(grams)));

export function photoMealReducer(state: PhotoMealState, action: PhotoMealAction): PhotoMealState {
  switch (action.type) {
    case 'photo-selected':
      return { ...createPhotoMeal(state.meal), phase: 'ready', photoUri: action.uri, requestId: state.requestId + 1 };
    case 'analysis-started':
      return state.photoUri && state.phase !== 'analyzing'
        ? { ...state, phase: 'analyzing', items: [], error: null, requestId: state.requestId + 1 } : state;
    case 'analysis-succeeded': {
      if (state.phase !== 'analyzing' || action.requestId !== state.requestId) return state;
      const items = action.analysis.items.filter(validItem).map((item) => ({ ...item, grams: clampGrams(item.grams) }));
      return items.length
        ? { ...state, phase: 'review', items, source: action.analysis.source }
        : { ...state, phase: 'error', error: 'No reconocimos alimentos en la foto. Prueba con más luz o con el plato completo a la vista.' };
    }
    case 'analysis-failed':
      return state.phase === 'analyzing' && action.requestId === state.requestId
        ? { ...state, phase: 'error', error: action.message } : state;
    case 'adjust-grams':
      return state.phase === 'review'
        ? { ...state, items: state.items.map((item) => item.id === action.id ? { ...item, grams: clampGrams(item.grams + action.delta) } : item) }
        : state;
    case 'remove-item':
      return state.phase === 'review' ? { ...state, items: state.items.filter((item) => item.id !== action.id) } : state;
    case 'select-meal':
      return { ...state, meal: action.meal };
    case 'reset':
      return { ...createPhotoMeal(state.meal), requestId: state.requestId + 1 };
  }
}

export function detectedNutrients(item: DetectedFood): Nutrients {
  const factor = item.grams / 100;
  return { kcal: item.per100g.kcal * factor, protein: item.per100g.protein * factor,
    carbs: item.per100g.carbs * factor, fat: item.per100g.fat * factor };
}

export function photoMealTotals(state: PhotoMealState): Nutrients {
  return sumNutrients(state.items.map(detectedNutrients));
}

export function canRegisterPhotoMeal(state: PhotoMealState): boolean {
  return state.phase === 'review' && state.items.length > 0;
}

// El diario asigna id y fecha; aquí solo se arma el registro con los gramos revisados.
export function photoMealToEntry(state: PhotoMealState): FoodEntry | null {
  if (!canRegisterPhotoMeal(state)) return null;
  const items = state.items.map((item) => ({ foodId: `photo:${item.id}`, name: item.name, grams: item.grams, nutrients: detectedNutrients(item) }));
  return { id: 0, meal: state.meal, items, nutrients: sumNutrients(items.map((item) => item.nutrients)) };
}
