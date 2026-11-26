import { useMemo, useState } from 'react';
import { useStore } from 'zustand';
import { createProgressPreview } from './data/progress.preview';
import { createEmptyProgress } from './domain/progress';
import { createProgressStore } from './state/progress-store';
import { useTrainingHistory } from '../training/useTraining';
import { useWeights } from '../nutrition/useNutrition';

// Período elegido en memoria. El historial de sesiones (SY-03) y los pesajes (SY-04) vienen
// de Supabase.
export const progressStore = createProgressStore(__DEV__ ? createProgressPreview() : createEmptyProgress());

export function useProgressStore(empty = false) {
  const [emptyStore] = useState(() => createProgressStore(createEmptyProgress()));
  const local = useStore(empty ? emptyStore : progressStore);
  const history = useTrainingHistory();
  const weights = useWeights();
  return useMemo(() => {
    if (empty) return local;
    return { ...local,
      ...(history.isSuccess ? { workouts: history.data.workouts } : {}),
      ...(weights.isSuccess ? { weights: weights.data } : {}) };
  }, [empty, local, history.isSuccess, history.data, weights.isSuccess, weights.data]);
}

export function resetProgress() {
  progressStore.setState({ ...createEmptyProgress(), period: '4w' });
}

export function progressSnapshot() {
  const { workouts, weights } = progressStore.getState();
  return { workouts, weights };
}
