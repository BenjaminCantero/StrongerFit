import { useMemo, useState } from 'react';
import { useStore } from 'zustand';
import { createProgressPreview } from './data/progress.preview';
import { createEmptyProgress } from './domain/progress';
import { createProgressStore } from './state/progress-store';
import { useTrainingHistory } from '../training/useTraining';

// Memoria compartida entre Entrenar y Progreso. El historial de sesiones viene de Supabase
// (SY-03); los pesos siguen en memoria hasta SY-04.
export const progressStore = createProgressStore(__DEV__ ? createProgressPreview() : createEmptyProgress());

export function useProgressStore(empty = false) {
  const [emptyStore] = useState(() => createProgressStore(createEmptyProgress()));
  const local = useStore(empty ? emptyStore : progressStore);
  const history = useTrainingHistory();
  return useMemo(() => !empty && history.isSuccess ? { ...local, workouts: history.data.workouts } : local,
    [empty, local, history.isSuccess, history.data]);
}

export function resetProgress() {
  progressStore.setState({ ...createEmptyProgress(), period: '4w' });
}

export function progressSnapshot() {
  const { workouts, weights } = progressStore.getState();
  return { workouts, weights };
}
