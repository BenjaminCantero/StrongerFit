import { useState } from 'react';
import { useStore } from 'zustand';
import { createProgressPreview } from './data/progress.preview';
import { createEmptyProgress } from './domain/progress';
import { createProgressStore } from './state/progress-store';

// Memoria compartida entre Entrenar y Progreso. Sin persistencia ni llamadas de red.
export const progressStore = createProgressStore(__DEV__ ? createProgressPreview() : createEmptyProgress());

export function useProgressStore(empty = false) {
  const [emptyStore] = useState(() => createProgressStore(createEmptyProgress()));
  return useStore(empty ? emptyStore : progressStore);
}

export function resetProgress() {
  progressStore.setState({ ...createEmptyProgress(), period: '4w' });
}

export function progressSnapshot() {
  const { workouts, weights } = progressStore.getState();
  return { workouts, weights };
}
