import type { Plan } from '@strongerfit/training-engine';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useOptionalUserId } from '../features/account/SessionContext';
import { routinePreferencesOf } from '../features/profile/domain/profile';
import { useProfile } from '../features/profile/useProfile';
import { RoutineSuggestionsScreen } from '../features/training/RoutineSuggestionsScreen';
import { planInput } from '../features/training/domain/plan';
import { useSaveWorkoutPlan } from '../features/training/useTraining';
import { dataErrorMessage, toDataError } from '../lib/data/errors';

export default function RoutineSuggestionsRoute() {
  const router = useRouter();
  const userId = useOptionalUserId();
  const { profile, dispatch } = useProfile();
  const savePlan = useSaveWorkoutPlan();
  const [error, setError] = useState<string | null>(null);

  const handleSavePrefs = (prefs: ReturnType<typeof routinePreferencesOf>, days: number) => {
    dispatch({ type: 'update-routine-preferences', routinePreferences: prefs, daysPerWeek: days });
  };

  const handleSelectPlan = (plan: Plan, prefs: ReturnType<typeof routinePreferencesOf>, days: number) => {
    setError(null);
    dispatch({ type: 'update-routine-preferences', routinePreferences: prefs, daysPerWeek: days });
    if (!userId) {
      dispatch({
        type: 'set-training-plan',
        trainingPlan: {
          ...plan,
          id: `local-${plan.templateId}`,
          dayIds: plan.days.map((_, idx) => `local-day-${idx}`),
          createdAt: new Date().toISOString(),
        },
      });
      router.dismissTo('/training');
      return;
    }
    savePlan.mutate(plan, {
      onSuccess: () => router.dismissTo('/training'),
      onError: (err) => setError(dataErrorMessage(toDataError(err))),
    });
  };

  return (
    <RoutineSuggestionsScreen
      input={planInput(profile)}
      goal={profile.onboarding?.goal ?? 'health'}
      initialPreferences={routinePreferencesOf(profile)}
      busy={savePlan.isPending}
      error={error}
      onSavePreferences={handleSavePrefs}
      onSelectPlan={handleSelectPlan}
      onProfile={() => router.push('/onboarding')}
    />
  );
}
