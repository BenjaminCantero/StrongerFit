import { describe, expect, it } from 'vitest';
import { createEmptyDiary, diaryReducer, diaryTotals } from './diary';
import {
  canRegisterPhotoMeal, createPhotoMeal, MAX_ITEM_GRAMS, photoMealReducer, photoMealToEntry, photoMealTotals,
  type PhotoAnalysis, type PhotoMealState,
} from './photo-analysis';

const analysis: PhotoAnalysis = {
  source: 'test',
  items: [
    { id: 'rice', name: 'Arroz', grams: 150, confidence: 0.9, per100g: { kcal: 130, protein: 2.7, carbs: 28.2, fat: 0.3 } },
    { id: 'chicken', name: 'Pollo', grams: 120, confidence: 0.5, per100g: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 } },
  ],
};

function analyzing(): PhotoMealState {
  const ready = photoMealReducer(createPhotoMeal('dinner'), { type: 'photo-selected', uri: 'file://plato.jpg' });
  return photoMealReducer(ready, { type: 'analysis-started' });
}

function reviewed(): PhotoMealState {
  const state = analyzing();
  return photoMealReducer(state, { type: 'analysis-succeeded', requestId: state.requestId, analysis });
}

describe('registro de comida por foto', () => {
  it('recorre foto, análisis y revisión, conservando la comida elegida', () => {
    const state = reviewed();
    expect(state.phase).toBe('review');
    expect(state.meal).toBe('dinner');
    expect(photoMealTotals(state).kcal).toBeCloseTo(195 + 198);
    expect(canRegisterPhotoMeal(state)).toBe(true);
  });

  it('no permite analizar sin foto ni iniciar dos análisis a la vez', () => {
    expect(photoMealReducer(createPhotoMeal(), { type: 'analysis-started' }).phase).toBe('idle');
    const state = analyzing();
    expect(photoMealReducer(state, { type: 'analysis-started' })).toBe(state);
  });

  it('descarta respuestas de un análisis anterior o cancelado', () => {
    const first = analyzing();
    const reset = photoMealReducer(first, { type: 'reset' });
    expect(photoMealReducer(reset, { type: 'analysis-succeeded', requestId: first.requestId, analysis }).phase).toBe('idle');

    const retaken = photoMealReducer(first, { type: 'photo-selected', uri: 'file://otro.jpg' });
    const second = photoMealReducer(retaken, { type: 'analysis-started' });
    expect(photoMealReducer(second, { type: 'analysis-failed', requestId: first.requestId, message: 'x' }).phase).toBe('analyzing');
  });

  it('informa error si no se reconoce ningún alimento válido', () => {
    const state = analyzing();
    const invalid = { source: 'test', items: [{ ...analysis.items[0]!, grams: Number.NaN }] };
    const next = photoMealReducer(state, { type: 'analysis-succeeded', requestId: state.requestId, analysis: invalid });
    expect(next.phase).toBe('error');
    expect(next.error).toMatch(/No reconocimos/);
  });

  it('ajusta gramos dentro de límites y permite quitar alimentos', () => {
    let state = reviewed();
    state = photoMealReducer(state, { type: 'adjust-grams', id: 'rice', delta: -1000 });
    expect(state.items[0]!.grams).toBe(5);
    state = photoMealReducer(state, { type: 'adjust-grams', id: 'rice', delta: 10_000 });
    expect(state.items[0]!.grams).toBe(MAX_ITEM_GRAMS);
    state = photoMealReducer(state, { type: 'remove-item', id: 'rice' });
    state = photoMealReducer(state, { type: 'remove-item', id: 'chicken' });
    expect(canRegisterPhotoMeal(state)).toBe(false);
    expect(photoMealToEntry(state)).toBeNull();
  });

  it('genera un registro válido para el diario con los gramos revisados', () => {
    const state = photoMealReducer(reviewed(), { type: 'adjust-grams', id: 'chicken', delta: 30 });
    const entry = photoMealToEntry(state)!;
    expect(entry.meal).toBe('dinner');
    expect(entry.items.map((item) => item.foodId)).toEqual(['photo:rice', 'photo:chicken']);
    expect(entry.items[1]!.grams).toBe(150);

    const diary = diaryReducer(createEmptyDiary('2026-11-04'), { type: 'add', date: '2026-11-04', entry });
    expect(diary.entries).toHaveLength(1);
    expect(diaryTotals(diary.entries).kcal).toBeCloseTo(195 + 247.5);
  });
});
