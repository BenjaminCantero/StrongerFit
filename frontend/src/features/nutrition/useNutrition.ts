import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MealPlan, NutritionTargets, Person } from '@strongerfit/nutrition-engine';
import { useContext } from 'react';
import { userKey } from '../../lib/data/keys';
import { SessionContext } from '../account/SessionContext';
import { swapChanges } from './data/nutrition.mappers';
import { fetchFoodLogs, fetchMealPlan, fetchNutritionPlan, fetchWeights, recordWeight, saveMealPlan, saveNutritionTargets, swapMeals,
  writeDiary, type DiaryWrite } from './data/nutrition.repository';
import type { GoalSettings } from './domain/goals';

export const nutritionKey = (userId: string) => userKey(userId, 'nutrition');
export const diaryWriteKey = ['diary-write'] as const;

// Id numérico estable por registro mientras la app está abierta: las pantallas lo usan en rutas.
const localIds = new Map<string, number>();
const localIdFor = (entryId: string) => {
  if (!localIds.has(entryId)) localIds.set(entryId, localIds.size + 1);
  return localIds.get(entryId)!;
};

function useUserQuery<T>(key: readonly unknown[], queryFn: () => Promise<T>) {
  const { userId } = useContext(SessionContext);
  return useQuery({ queryKey: [...userKey(userId ?? 'anon'), ...key], queryFn, enabled: userId !== null });
}

export const useFoodLogs = (date: string) => useUserQuery(['nutrition', 'diary', date], () => fetchFoodLogs(date, localIdFor));
export const useNutritionPlan = () => useUserQuery(['nutrition', 'targets'], fetchNutritionPlan);
export const useMealPlan = () => useUserQuery(['nutrition', 'meal-plan'], fetchMealPlan);
export const useWeights = () => useUserQuery(['progress', 'weights'], fetchWeights);

// Las escrituras refrescan todo lo de la persona: metas, minuta, Inicio e identidad (último peso).
function useUserMutation<T, R>(write: (input: T) => Promise<R>, mutationKey?: readonly unknown[]) {
  const { userId } = useContext(SessionContext);
  const client = useQueryClient();
  return useMutation({ mutationKey, mutationFn: write, onSuccess: () => client.invalidateQueries({ queryKey: userKey(userId ?? 'anon') }) });
}

export const useDiaryWrite = () => useUserMutation((write: DiaryWrite) => writeDiary(write), diaryWriteKey);
export const useSaveNutritionTargets = () => useUserMutation(({ person, settings, result }: { person: Person; settings: GoalSettings; result: NutritionTargets }) =>
  saveNutritionTargets(person, settings, result));
export const useSaveMealPlan = () => useUserMutation(({ plan, nutritionTargetId, weekStart }: { plan: MealPlan; nutritionTargetId: string; weekStart: string }) =>
  saveMealPlan(plan, nutritionTargetId, weekStart));
export const useSwapMeals = () => useUserMutation(({ planId, before, after }: { planId: string; before: MealPlan; after: MealPlan }) =>
  swapMeals(planId, swapChanges(before, after)));
export const useRecordWeight = () => useUserMutation(({ date, kg }: { date: string; kg: number }) => recordWeight(date, kg));
