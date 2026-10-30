import { describe, expect, it } from 'vitest';
import { foodsPreview } from '../data/foods.preview';
import { canConfirm, createFoodEntry, draftTotals, foodEntryReducer, nutrientsForGrams, parseGrams, searchFoods,
  type FoodEntryState } from './food-entry';

const initial = () => createFoodEntry(foodsPreview);

describe('cantidad y nutrientes', () => {
  it('escala la base por 100 g y conserva precisión antes del redondeo de presentación', () => {
    const nutrients = nutrientsForGrams(foodsPreview[0]!, 150);
    expect(nutrients.kcal).toBe(247.5);
    expect(nutrients.protein).toBe(46.5);
    expect(nutrients.carbs).toBe(0);
    expect(nutrients.fat).toBeCloseTo(5.4);
  });

  it('convierte 150 g en 1,25 porciones de 120 g y calcula una porción completa', () => {
    let state = foodEntryReducer(initial(), { type: 'set-mode', mode: 'portions' });
    expect(state.draft.quantity).toBe('1,25');
    expect(state.draft.grams).toBe(150);
    state = foodEntryReducer(state, { type: 'set-quantity', value: '1' });
    expect(state.draft.grams).toBe(120);
    expect(draftTotals(state).kcal).toBe(198);
  });

  it('conserva gramos exactos tras alternar unidades con una fracción periódica', () => {
    let state = foodEntryReducer(initial(), { type: 'set-quantity', value: '155' });
    for (let index = 0; index < 10; index++) {
      state = foodEntryReducer(state, { type: 'set-mode', mode: 'portions' });
      state = foodEntryReducer(state, { type: 'set-mode', mode: 'grams' });
    }
    expect(state.draft.grams).toBe(155);
    expect(state.draft.quantity).toBe('155');
  });

  it('los ajustes rápidos siguen expresados en gramos aunque se muestren porciones', () => {
    let state = foodEntryReducer(initial(), { type: 'set-mode', mode: 'portions' });
    state = foodEntryReducer(state, { type: 'adjust-grams', delta: 10 });
    expect(state.draft.grams).toBe(160);
    state = foodEntryReducer(state, { type: 'adjust-grams', delta: -1000 });
    expect(state.draft.grams).toBe(0);
    expect(canConfirm(state)).toBe(false);
    expect(foodEntryReducer(state, { type: 'reset-quantity' }).draft.grams).toBe(150);
  });

  it('acepta decimales locales y rechaza entradas vacías, negativas o no finitas', () => {
    expect(parseGrams('1,5', 'portions', 120)).toBe(180);
    expect(parseGrams('1.5', 'portions', 120)).toBe(180);
    for (const value of ['', '-1', 'NaN', 'Infinity', '2e3', '1,2,3', '1,1234567']) {
      const state = foodEntryReducer(initial(), { type: 'set-quantity', value });
      expect(state.draft.grams).toBeNull();
      expect(canConfirm(state)).toBe(false);
      expect(foodEntryReducer(state, { type: 'confirm' }).entries).toHaveLength(0);
    }
  });

  it('edita con teclado, decimal y retroceso sin admitir separadores duplicados', () => {
    let state = foodEntryReducer(initial(), { type: 'set-mode', mode: 'portions' });
    state = foodEntryReducer(state, { type: 'key', key: 'clear' });
    for (const key of ['1', ',', '2', '5']) state = foodEntryReducer(state, { type: 'key', key });
    expect(state.draft.grams).toBe(150);
    expect(foodEntryReducer(state, { type: 'key', key: ',' })).toBe(state);
    state = foodEntryReducer(state, { type: 'key', key: 'backspace' });
    expect(state.draft.quantity).toBe('1,2');
    expect(state.draft.grams).toBe(144);
  });
});

describe('selección y confirmación', () => {
  it('suma y quita acompañamientos sin duplicarlos ni cambiar la cantidad principal', () => {
    let state = foodEntryReducer(initial(), { type: 'toggle-side', foodId: 'avocado' });
    state = foodEntryReducer(state, { type: 'toggle-side', foodId: 'bread' });
    expect(draftTotals(state).kcal).toBe(462.5);
    expect(draftTotals(state).protein).toBe(52);
    expect(state.draft.grams).toBe(150);
    state = foodEntryReducer(state, { type: 'toggle-side', foodId: 'avocado' });
    expect(draftTotals(state).kcal).toBe(382.5);
    expect(foodEntryReducer(state, { type: 'toggle-side', foodId: 'chicken' })).toBe(state);
    expect(foodEntryReducer(state, { type: 'toggle-side', foodId: 'unknown' })).toBe(state);
  });

  it('cambiar de alimento reinicia cantidad, unidad y acompañamientos conservando la comida', () => {
    let state = foodEntryReducer(initial(), { type: 'select-meal', meal: 'dinner' });
    state = foodEntryReducer(state, { type: 'toggle-side', foodId: 'avocado' });
    state = foodEntryReducer(state, { type: 'set-mode', mode: 'portions' });
    state = foodEntryReducer(state, { type: 'select-food', foodId: 'bread' });
    expect(state.draft).toEqual({ foodId: 'bread', meal: 'dinner', mode: 'grams', quantity: '50', grams: 50, sideIds: [] });
    expect(foodsPreview[0]?.defaultGrams).toBe(150);
  });

  it('confirma una sola vez y conserva un snapshot independiente de ediciones posteriores', () => {
    let state = foodEntryReducer(initial(), { type: 'select-meal', meal: 'snack' });
    state = foodEntryReducer(state, { type: 'toggle-side', foodId: 'avocado' });
    state = foodEntryReducer(state, { type: 'confirm' });
    expect(state.entries).toHaveLength(1);
    expect(state.lastEntry).toMatchObject({ id: 1, meal: 'snack', nutrients: { kcal: 327.5 } });
    expect(state.lastEntry?.items).toHaveLength(2);
    expect(foodEntryReducer(state, { type: 'confirm' })).toBe(state);
    expect(foodEntryReducer(state, { type: 'set-quantity', value: '300' })).toBe(state);
    let next: FoodEntryState = foodEntryReducer(state, { type: 'start-new' });
    next = foodEntryReducer(next, { type: 'select-food', foodId: 'bread' });
    next = foodEntryReducer(next, { type: 'confirm' });
    expect(next.entries).toHaveLength(2);
    expect(next.entries[0]).toBe(state.entries[0]);
    expect(next.entries[0]?.nutrients.kcal).toBe(327.5);
    expect(next.lastEntry?.id).toBe(2);
  });

  it('busca sin distinguir acentos, mayúsculas u orden de palabras', () => {
    expect(searchFoods(foodsPreview, ' PLANCHA pechugá ').map((food) => food.id)).toEqual(['chicken']);
    expect(searchFoods(foodsPreview, '').map((food) => food.id)).toEqual(['chicken', 'avocado', 'bread', 'oats', 'walnuts', 'quinoa']);
    expect(searchFoods(foodsPreview, 'alimento inexistente')).toEqual([]);
  });
});
