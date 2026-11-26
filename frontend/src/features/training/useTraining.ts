import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LOAD_RULE_VERSION, type Plan, type PlannedExercise } from '@strongerfit/training-engine';
import { useContext } from 'react';
import { userKey } from '../../lib/data/keys';
import { SessionContext } from '../account/SessionContext';
import type { OverloadDecision } from './components/OverloadSuggestions';
import { fetchActivePlan, fetchTimerPresets, fetchTrainingHistory, recordLoadDecision, saveTimerPreset, saveWorkoutPlan,
  updatePlanExercise } from './data/training.repository';
import type { TimerSpec } from './domain/timers';

export const trainingKey = (userId: string) => userKey(userId, 'training');

function useTrainingQuery<T>(part: string, queryFn: () => Promise<T>) {
  const { userId } = useContext(SessionContext);
  return useQuery({ queryKey: [...trainingKey(userId ?? 'anon'), part], queryFn, enabled: userId !== null });
}

export const useActivePlan = () => useTrainingQuery('plan', fetchActivePlan);
export const useTrainingHistory = () => useTrainingQuery('history', fetchTrainingHistory);
export const useTimerPresets = () => useTrainingQuery('timers', fetchTimerPresets);

function useTrainingMutation<T, R>(write: (input: T) => Promise<R>) {
  const { userId } = useContext(SessionContext);
  const client = useQueryClient();
  return useMutation({
    mutationFn: write,
    // Plan, historial y cargas se derivan entre sí: se refresca todo el entrenamiento.
    onSuccess: () => client.invalidateQueries({ queryKey: trainingKey(userId ?? 'anon') }),
  });
}

export const useSaveWorkoutPlan = () => useTrainingMutation((plan: Plan) => saveWorkoutPlan(plan));
export const useUpdatePlanExercise = () => useTrainingMutation(({ dayId, index, exercise }: { dayId: string; index: number; exercise: PlannedExercise }) =>
  updatePlanExercise(dayId, index, exercise));
export const useRecordLoadDecision = () => useTrainingMutation((decision: OverloadDecision) => recordLoadDecision(decision, LOAD_RULE_VERSION));
export const useSaveTimerPreset = () => useTrainingMutation(({ exerciseId, restSeconds, spec }: { exerciseId: string; restSeconds: number; spec: TimerSpec }) =>
  saveTimerPreset(exerciseId, restSeconds, spec));
