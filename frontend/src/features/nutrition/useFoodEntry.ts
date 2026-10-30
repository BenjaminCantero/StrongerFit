import { useReducer, useRef } from 'react';
import { createFoodEntry, draftTotals, foodEntryReducer, selectedFood, type Food, type InitialFoodDraft } from './domain/food-entry';

export function useFoodEntry(foods: readonly Food[], initial: InitialFoodDraft = {}) {
  const [state, send] = useReducer(foodEntryReducer, { foods, initial }, (value) => createFoodEntry(value.foods, value.initial));
  const submitted = useRef(false);
  const food = selectedFood(state);
  const suggestions = foods.filter((item) => food.pairingIds.includes(item.id));
  function confirm() {
    if (submitted.current) return null;
    const confirmed = foodEntryReducer(state, { type: 'confirm' });
    if (!confirmed.lastEntry) return null;
    submitted.current = true;
    send({ type: 'confirm' });
    return confirmed.lastEntry;
  }
  return { state, food, totals: draftTotals(state), suggestions, send, confirm };
}
