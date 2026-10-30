export type Nutrients = { kcal: number; protein: number; carbs: number; fat: number };
export type MealId = 'breakfast' | 'lunch' | 'snack' | 'dinner';
export type QuantityMode = 'grams' | 'portions';
export type Food = {
  id: string;
  name: string;
  per100g: Nutrients;
  servingGrams: number;
  defaultGrams: number;
  pairingIds: string[];
};
export type FoodDraft = {
  foodId: string;
  meal: MealId;
  mode: QuantityMode;
  quantity: string;
  grams: number | null;
  sideIds: string[];
};
export type FoodEntry = {
  id: number;
  meal: MealId;
  items: { foodId: string; name: string; grams: number; nutrients: Nutrients }[];
  nutrients: Nutrients;
};
export type FoodEntryState = {
  foods: readonly Food[];
  draft: FoodDraft;
  entries: FoodEntry[];
  lastEntry: FoodEntry | null;
};
export type FoodEntryAction =
  | { type: 'select-food'; foodId: string }
  | { type: 'select-meal'; meal: MealId }
  | { type: 'set-mode'; mode: QuantityMode }
  | { type: 'set-quantity'; value: string }
  | { type: 'key'; key: string }
  | { type: 'adjust-grams'; delta: number }
  | { type: 'reset-quantity' }
  | { type: 'toggle-side'; foodId: string }
  | { type: 'confirm' }
  | { type: 'start-new' };

export const emptyNutrients = (): Nutrients => ({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
const quantityText = (value: number) => String(Number(value.toFixed(6))).replace('.', ',');

function newDraft(food: Food, meal: MealId = 'lunch'): FoodDraft {
  return { foodId: food.id, meal, mode: 'grams', quantity: quantityText(food.defaultGrams), grams: food.defaultGrams, sideIds: [] };
}

export type InitialFoodDraft = { meal?: MealId; entry?: FoodEntry };

export function isMealId(value: unknown): value is MealId {
  return typeof value === 'string' && ['breakfast', 'lunch', 'snack', 'dinner'].includes(value);
}

export function createFoodEntry(foods: readonly Food[], initial: InitialFoodDraft = {}): FoodEntryState {
  if (!foods.length) throw new Error('Se requiere un catálogo para registrar alimentos.');
  const item = initial.entry?.items[0];
  const food = item ? foods.find((candidate) => candidate.id === item.foodId) : foods[0];
  if (!food) throw new Error('El alimento del registro no está disponible.');
  const draft = newDraft(food, initial.entry?.meal ?? initial.meal);
  if (item) {
    draft.grams = item.grams;
    draft.quantity = quantityText(item.grams);
    draft.sideIds = initial.entry!.items.slice(1).map((side) => side.foodId);
  }
  return { foods, draft, entries: [], lastEntry: null };
}

export function selectedFood(state: FoodEntryState): Food {
  return state.foods.find((food) => food.id === state.draft.foodId)!;
}

export function nutrientsForGrams(food: Food, grams: number): Nutrients {
  const factor = Number.isFinite(grams) && grams > 0 ? grams / 100 : 0;
  return { kcal: food.per100g.kcal * factor, protein: food.per100g.protein * factor,
    carbs: food.per100g.carbs * factor, fat: food.per100g.fat * factor };
}

export function sumNutrients(items: Nutrients[]): Nutrients {
  return items.reduce((total, item) => ({ kcal: total.kcal + item.kcal, protein: total.protein + item.protein,
    carbs: total.carbs + item.carbs, fat: total.fat + item.fat }), emptyNutrients());
}

export function selectedSides(state: FoodEntryState): Food[] {
  return state.foods.filter((food) => state.draft.sideIds.includes(food.id));
}

export function draftTotals(state: FoodEntryState): Nutrients {
  return sumNutrients([
    nutrientsForGrams(selectedFood(state), state.draft.grams ?? 0),
    ...selectedSides(state).map((food) => nutrientsForGrams(food, food.servingGrams)),
  ]);
}

export function parseGrams(text: string, mode: QuantityMode, servingGrams: number): number | null {
  if (!/^\d+(?:[.,]\d{0,6})?$/.test(text.trim())) return null;
  const value = Number(text.trim().replace(',', '.'));
  const grams = value * (mode === 'grams' ? 1 : servingGrams);
  return Number.isFinite(grams) && grams >= 0 ? grams : null;
}

export function canConfirm(state: FoodEntryState): boolean {
  return state.lastEntry === null && state.draft.grams !== null && Number.isFinite(state.draft.grams) && state.draft.grams > 0;
}

export function searchFoods(foods: readonly Food[], query: string): Food[] {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return foods.filter((food) => words.every((word) => normalize(food.name).includes(word)));
}

export function foodEntryReducer(state: FoodEntryState, action: FoodEntryAction): FoodEntryState {
  if (action.type === 'start-new') {
    return { ...state, lastEntry: null, draft: newDraft(selectedFood(state), state.draft.meal) };
  }
  if (state.lastEntry) return state;
  const food = selectedFood(state);
  const draft = state.draft;
  function setQuantity(value: string): FoodEntryState {
    return { ...state, draft: { ...draft, quantity: value, grams: parseGrams(value, draft.mode, food.servingGrams) } };
  }
  function setGrams(grams: number): FoodEntryState {
    if (!Number.isFinite(grams)) return state;
    return { ...state, draft: { ...draft, grams, quantity: quantityText(draft.mode === 'grams' ? grams : grams / food.servingGrams) } };
  }
  switch (action.type) {
    case 'select-food': {
      const selected = state.foods.find((item) => item.id === action.foodId);
      return selected ? { ...state, draft: newDraft(selected, draft.meal) } : state;
    }
    case 'select-meal': return { ...state, draft: { ...draft, meal: action.meal } };
    case 'set-mode':
      // Conserva los gramos exactos aunque la representación en porciones se redondee.
      return { ...state, draft: { ...draft, mode: action.mode,
        quantity: draft.grams === null ? draft.quantity : quantityText(action.mode === 'grams' ? draft.grams : draft.grams / food.servingGrams) } };
    case 'set-quantity': return setQuantity(action.value);
    case 'reset-quantity': return setGrams(food.defaultGrams);
    case 'adjust-grams':
      return Number.isFinite(action.delta) ? setGrams(Math.max(0, (draft.grams ?? 0) + action.delta)) : state;
    case 'key': {
      if (action.key === 'clear') return setQuantity('');
      if (action.key === 'backspace') return setQuantity(draft.quantity.slice(0, -1));
      if (action.key === ',') return draft.quantity.includes(',') || draft.quantity.includes('.') ? state : setQuantity(`${draft.quantity || '0'},`);
      if (!/^\d$/.test(action.key) || draft.quantity.length >= 10) return state;
      return setQuantity(draft.quantity === '0' ? action.key : draft.quantity + action.key);
    }
    case 'toggle-side': {
      if (!food.pairingIds.includes(action.foodId) || !state.foods.some((item) => item.id === action.foodId)) return state;
      return { ...state, draft: { ...draft, sideIds: draft.sideIds.includes(action.foodId)
        ? draft.sideIds.filter((id) => id !== action.foodId) : [...draft.sideIds, action.foodId] } };
    }
    case 'confirm': {
      if (!canConfirm(state)) return state;
      const items = [{ food, grams: draft.grams! }, ...selectedSides(state).map((side) => ({ food: side, grams: side.servingGrams }))]
        .map(({ food: item, grams }) => ({ foodId: item.id, name: item.name, grams, nutrients: nutrientsForGrams(item, grams) }));
      const entry: FoodEntry = { id: state.entries.length + 1, meal: draft.meal, items, nutrients: draftTotals(state) };
      return { ...state, entries: [...state.entries, entry], lastEntry: entry };
    }
  }
}
