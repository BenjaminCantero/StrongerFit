import { describe, expect, it } from 'vitest';
import { foodsPreview } from '../data/foods.preview';
import { createEmptyDiary, diaryReducer } from './diary';
import { clampItemGrams, isExternalEntry, rescaleEntry, sourceLabel } from './entry-adjust';
import type { FoodEntry } from './food-entry';

const scanned: FoodEntry = {
  id: 1, meal: 'snack', nutrients: { kcal: 80.85, protein: 0.945, carbs: 8.625, fat: 4.635 },
  items: [{ foodId: 'off:3017620422003', name: 'Nutella', grams: 15, nutrients: { kcal: 80.85, protein: 0.945, carbs: 8.625, fat: 4.635 } }],
};

describe('ajuste de registros externos', () => {
  it('distingue registros fuera del catálogo y su origen', () => {
    expect(isExternalEntry(scanned, foodsPreview)).toBe(true);
    const catalogEntry = { ...scanned, items: [{ ...scanned.items[0]!, foodId: foodsPreview[0]!.id }] };
    expect(isExternalEntry(catalogEntry, foodsPreview)).toBe(false);
    expect(sourceLabel('off:1')).toBe('Código de barras');
    expect(sourceLabel('photo:rice')).toBe('Foto del plato');
  });

  it('reescala nutrientes por gramos y cambia la comida', () => {
    const next = rescaleEntry(scanned, [30], 'breakfast')!;
    expect(next.meal).toBe('breakfast');
    expect(next.items[0]!.grams).toBe(30);
    expect(next.nutrients.kcal).toBeCloseTo(161.7);
    expect(next.items[0]!.nutrients.fat).toBeCloseTo(9.27);
  });

  it('rechaza cantidades inválidas y limita los ajustes', () => {
    expect(rescaleEntry(scanned, [0], 'snack')).toBeNull();
    expect(rescaleEntry(scanned, [2001], 'snack')).toBeNull();
    expect(rescaleEntry(scanned, [10, 20], 'snack')).toBeNull();
    expect(clampItemGrams(-5)).toBe(1);
    expect(clampItemGrams(5000)).toBe(2000);
  });

  it('el diario acepta la actualización sin duplicar', () => {
    let diary = diaryReducer(createEmptyDiary('2026-11-04'), { type: 'add', date: '2026-11-04', entry: scanned });
    const id = diary.entries[0]!.id;
    diary = diaryReducer(diary, { type: 'update', id, entry: rescaleEntry(diary.entries[0]!, [45], 'dinner')! });
    expect(diary.entries).toHaveLength(1);
    expect(diary.entries[0]).toMatchObject({ meal: 'dinner', date: '2026-11-04' });
    expect(diary.entries[0]!.nutrients.kcal).toBeCloseTo(242.55);
  });
});
