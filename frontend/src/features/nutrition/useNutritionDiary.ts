import { useMemo } from 'react';
import { useStore } from 'zustand';
import { createEmptyDiary, todayDateKey } from './domain/diary';
import { createDiaryStore } from './state/diary-store';
import { useFoodLogs, useNutritionPlan } from './useNutrition';
import { usePreviewMode } from '../dev/previewMode';
import { devPreview } from '../dev/devPreview';

// Fecha elegida en memoria; registros y meta vienen de Supabase (SY-04). Los de ejemplo solo
// se ven con el modo vista previa.
const diaryStore = createDiaryStore(createEmptyDiary());
const previewDiary = devPreview()?.createPreviewDiary() ?? null;

export function useNutritionDiary() {
  const local = useStore(diaryStore);
  const today = todayDateKey();
  const selected = useFoodLogs(local.selectedDate);
  const todays = useFoodLogs(today);
  const plan = useNutritionPlan();
  const preview = usePreviewMode();
  return useMemo(() => {
    if (preview && previewDiary) return { ...local, entries: previewDiary.entries, targets: previewDiary.targets };
    if (!selected.isSuccess || !todays.isSuccess || !plan.isSuccess) return local;
    const entries = new Map([...todays.data, ...selected.data].map((entry) => [entry.id, entry]));
    const result = plan.data?.result;
    return { ...local, entries: [...entries.values()],
      targets: result ? { kcal: result.kcal, protein: result.protein, carbs: result.carbs, fat: result.fat } : null };
  }, [preview, local, selected.isSuccess, selected.data, todays.isSuccess, todays.data, plan.isSuccess, plan.data]);
}

export function resetNutritionDiary() {
  diaryStore.setState(createEmptyDiary());
}

export function nutritionDiarySnapshot() {
  const { dispatch: _dispatch, ...diary } = diaryStore.getState();
  return diary;
}
