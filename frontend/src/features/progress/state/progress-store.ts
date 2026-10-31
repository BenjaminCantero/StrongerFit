import { createStore } from 'zustand/vanilla';
import { progressReducer, type ProgressAction, type ProgressData, type ProgressState } from '../domain/progress';

type ProgressStore = ProgressState & { dispatch: (action: ProgressAction) => void };

export function createProgressStore(initial: ProgressData) {
  return createStore<ProgressStore>()((set) => ({
    ...initial,
    period: '4w',
    dispatch: (action) => set((state) => progressReducer(state, action)),
  }));
}
