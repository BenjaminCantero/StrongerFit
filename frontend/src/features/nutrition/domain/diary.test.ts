import { describe, expect, it } from 'vitest';
import { createPreviewDiary } from '../data/diary.preview';
import { foodsPreview } from '../data/foods.preview';
import { createDiaryStore } from '../state/diary-store';
import { createEmptyDiary, diaryReducer, diaryTotals, entriesForDate, isDateKey, shiftDate, todayDateKey } from './diary';
import { createFoodEntry, draftTotals, foodEntryReducer } from './food-entry';

const date = '2026-10-30';
const preview = () => createPreviewDiary(date);

describe('diario de alimentación', () => {
  it('calcula el balance desde los alimentos visibles, sin reutilizar el total del mockup', () => {
    const state = preview();
    const entries = entriesForDate(state);
    expect(diaryTotals(entries).kcal).toBeCloseTo(891.5);
    expect(diaryTotals(entries).kcal).toBeCloseTo(entries.flatMap((entry) => entry.items).reduce((total, item) => total + item.nutrients.kcal, 0));
    expect(entriesForDate(state, '2026-10-31')).toEqual([]);
    expect(createEmptyDiary(date).targets).toBeNull();
  });

  it('añade registros con IDs del diario y toma snapshots independientes del formulario', () => {
    const initial = preview();
    const entry = structuredClone(initial.entries[0]!);
    entry.nutrients.kcal = 99999;
    const added = diaryReducer(initial, { type: 'add', date: '2026-10-31', entry });
    expect(added.entries.at(-1)).toMatchObject({ id: 3, date: '2026-10-31', nutrients: { kcal: expect.closeTo(420) } });
    entry.items[0]!.nutrients.kcal = 0;
    expect(added.entries.at(-1)!.items[0]!.nutrients.kcal).toBeCloseTo(290);
    expect(entriesForDate(added)).toHaveLength(2);
    expect(added.nextId).toBe(4);
  });

  it('editar reemplaza un registro conservando ID y fecha, y permite moverlo a otra comida', () => {
    const initial = preview();
    let form = createFoodEntry(foodsPreview, { entry: initial.entries[1] });
    expect(form.draft).toMatchObject({ foodId: 'chicken', meal: 'lunch', grams: 150, sideIds: ['quinoa', 'avocado'] });
    expect(draftTotals(form).kcal).toBeCloseTo(471.5);
    form = foodEntryReducer(form, { type: 'set-quantity', value: '200' });
    form = foodEntryReducer(form, { type: 'select-meal', meal: 'dinner' });
    const entry = foodEntryReducer(form, { type: 'confirm' }).lastEntry!;
    const updated = diaryReducer(initial, { type: 'update', id: 2, entry });
    expect(updated.entries).toHaveLength(2);
    expect(updated.entries[1]).toMatchObject({ id: 2, date, meal: 'dinner' });
    expect(diaryTotals(entriesForDate(updated)).kcal).toBeCloseTo(974);
    expect(initial.entries[1]!.items[0]!.grams).toBe(150);
    expect(diaryReducer(initial, { type: 'update', id: 999, entry })).toBe(initial);
  });

  it('elimina solo los registros de la comida y fecha elegidas', () => {
    let state = preview();
    state = diaryReducer(state, { type: 'add', date: '2026-10-31', entry: state.entries[1]! });
    state = diaryReducer(state, { type: 'add', date, entry: state.entries[1]! });
    state = diaryReducer(state, { type: 'delete-meal', date, meal: 'lunch' });
    expect(entriesForDate(state)).toHaveLength(1);
    expect(diaryTotals(entriesForDate(state)).kcal).toBeCloseTo(420);
    expect(entriesForDate(state, '2026-10-31')).toHaveLength(1);
  });

  it('rechaza fechas inexistentes y cantidades inválidas sin alterar el diario', () => {
    const state = preview();
    expect(diaryReducer(state, { type: 'select-date', date: '2026-02-30' })).toBe(state);
    expect(diaryReducer(state, { type: 'add', date: 'ayer', entry: state.entries[0]! })).toBe(state);
    for (const grams of [0, -1, Infinity, NaN]) {
      const entry = structuredClone(state.entries[0]!);
      entry.items[0]!.grams = grams;
      expect(diaryReducer(state, { type: 'add', date, entry })).toBe(state);
    }
  });

  it('comparte cambios entre pantallas sin alterar los registros al navegar de día', () => {
    const store = createDiaryStore(preview());
    let updates = 0;
    const unsubscribe = store.subscribe(() => updates++);
    store.getState().dispatch({ type: 'select-date', date: '2026-10-31' });
    expect(entriesForDate(store.getState())).toEqual([]);
    store.getState().dispatch({ type: 'add', date: '2026-10-31', entry: preview().entries[0]! });
    expect(diaryTotals(entriesForDate(store.getState())).kcal).toBeCloseTo(420);
    store.getState().dispatch({ type: 'select-date', date });
    expect(entriesForDate(store.getState())).toHaveLength(2);
    expect(updates).toBe(3);
    unsubscribe();
  });
});

describe('fechas del diario', () => {
  it('valida años bisiestos y avanza por cambios de mes, año y horario de verano', () => {
    expect(isDateKey('2024-02-29')).toBe(true);
    expect(isDateKey('2026-02-29')).toBe(false);
    expect(isDateKey('2026-1-01')).toBe(false);
    expect(shiftDate('2024-02-28', 1)).toBe('2024-02-29');
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDate('2026-09-05', 1)).toBe('2026-09-06');
  });

  it('usa el día de Santiago cerca de medianoche UTC', () => {
    expect(todayDateKey(new Date('2026-10-31T01:00:00Z'))).toBe('2026-10-30');
    expect(todayDateKey(new Date('2026-10-31T04:00:00Z'))).toBe('2026-10-31');
  });
});
