import { useRouter } from 'expo-router';
import { useState } from 'react';
import { NutritionGoalsScreen } from '../features/nutrition/NutritionGoalsScreen';
import { goalPerson } from '../features/nutrition/domain/goals';
import { useSaveNutritionTargets } from '../features/nutrition/useNutrition';
import { useProfile } from '../features/profile/useProfile';
import { dataErrorMessage, toDataError } from '../lib/data/errors';

export default function NutritionGoalsRoute() {
  const router = useRouter();
  const { profile } = useProfile();
  const save = useSaveNutritionTargets();
  const [error, setError] = useState<string | null>(null);
  return <NutritionGoalsScreen profile={profile} error={error} saving={save.isPending} onEditProfile={() => router.navigate('/profile')}
    onSave={(settings, result) => {
      const person = goalPerson(profile);
      if (!person.ok) return;
      const { healthRisk: _risk, ...data } = person.person;
      setError(null);
      save.mutate({ person: data, settings, result }, {
        onSuccess: () => router.back(),
        onError: (failure) => setError(dataErrorMessage(toDataError(failure))),
      });
    }} />;
}
