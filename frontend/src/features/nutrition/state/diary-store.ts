import { createStore } from 'zustand/vanilla';
import { diaryReducer, type DiaryAction, type DiaryState } from '../domain/diary';

type DiaryStore = DiaryState & { dispatch: (action: DiaryAction) => void };

export function createDiaryStore(initial: DiaryState) {
  return createStore<DiaryStore>()((set) => ({
    ...initial,
    dispatch: (action) => set((state) => diaryReducer(state, action)),
  }));
}
