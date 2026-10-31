import { createStore } from 'zustand/vanilla';
import { sleepReducer, type SleepAction, type SleepState } from '../domain/sleep';

type SleepStore = SleepState & { dispatch: (action: SleepAction) => void };

export function createSleepStore(initial: SleepState) {
  return createStore<SleepStore>()((set) => ({
    ...initial,
    dispatch: (action) => set((state) => sleepReducer(state, action)),
  }));
}
