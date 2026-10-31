import { useStore } from 'zustand';
import { createPreviewDiary } from './data/diary.preview';
import { createEmptyDiary } from './domain/diary';
import { createDiaryStore } from './state/diary-store';

// Memoria compartida entre diario y formulario. Sin persistencia ni llamadas de red.
const diaryStore = createDiaryStore(__DEV__ ? createPreviewDiary() : createEmptyDiary());

export function useNutritionDiary() {
  return useStore(diaryStore);
}

export function resetNutritionDiary() {
  diaryStore.setState(createEmptyDiary());
}

export function nutritionDiarySnapshot() {
  const { dispatch: _dispatch, ...diary } = diaryStore.getState();
  return diary;
}
