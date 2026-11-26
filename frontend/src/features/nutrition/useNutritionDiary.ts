import { useMemo } from 'react';
import { useStore } from 'zustand';
import { createPreviewDiary } from './data/diary.preview';
import { createEmptyDiary, todayDateKey } from './domain/diary';
import { createDiaryStore } from './state/diary-store';
import { useFoodLogs, useNutritionPlan } from './useNutrition';

// Fecha elegida en memoria; registros y meta vienen de Supabase (SY-04). En desarrollo, sin
// sesión de datos todavía, se ven los de ejemplo hasta que el servidor responde.
const diaryStore = createDiaryStore(__DEV__ ? createPreviewDiary() : createEmptyDiary());

export function useNutritionDiary() {
  const local = useStore(diaryStore);
  const today = todayDateKey();
  const selected = useFoodLogs(local.selectedDate);
  const todays = useFoodLogs(today);
  const plan = useNutritionPlan();
  return useMemo(() => {
    if (!selected.isSuccess || !todays.isSuccess || !plan.isSuccess) return local;
    const entries = new Map([...todays.data, ...selected.data].map((entry) => [entry.id, entry]));
    const result = plan.data?.result;
    return { ...local, entries: [...entries.values()],
      targets: result ? { kcal: result.kcal, protein: result.protein, carbs: result.carbs, fat: result.fat } : null };
  }, [local, selected.isSuccess, selected.data, todays.isSuccess, todays.data, plan.isSuccess, plan.data]);
}

export function resetNutritionDiary() {
  diaryStore.setState(createEmptyDiary());
}

export function nutritionDiarySnapshot() {
  const { dispatch: _dispatch, ...diary } = diaryStore.getState();
  return diary;
}
