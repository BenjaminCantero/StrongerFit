import { useReducer } from 'react';
import { progressReducer, progressSummary, type ProgressData } from './domain/progress';

export function useProgress(initial: ProgressData, today: string) {
  const [state, dispatch] = useReducer(progressReducer, { ...initial, period: '4w' });
  return { state, dispatch, summary: progressSummary(state, state.period, today) };
}
