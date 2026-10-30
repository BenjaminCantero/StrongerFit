import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../components/Screen';
import { AppButton } from '../components/ui/AppButton';
import { AppText } from '../components/ui/AppText';
import { FoodRegistrationScreen } from '../features/nutrition/FoodRegistrationScreen';
import { foodsPreview } from '../features/nutrition/data/foods.preview';
import { isDateKey } from '../features/nutrition/domain/diary';
import { isMealId, type FoodEntry } from '../features/nutrition/domain/food-entry';
import { useNutritionDiary } from '../features/nutrition/useNutritionDiary';

export default function FoodEntryRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; meal?: string; entryId?: string; preview?: string }>();
  const diary = useNutritionDiary();
  const existing = params.entryId ? diary.entries.find((entry) => entry.id === Number(params.entryId)) : undefined;
  const date = existing?.date ?? params.date ?? diary.selectedDate;
  const exit = () => router.dismissTo('/nutrition');

  if (!isDateKey(date) || (params.entryId !== undefined && !existing) || (params.meal !== undefined && !isMealId(params.meal))) {
    return <Screen title="Registro no disponible" safeBottom>
      <AppText>La fecha o el registro solicitado no está disponible.</AppText>
      <AppButton label="Volver a Alimentación" onPress={exit} />
    </Screen>;
  }

  function save(entry: FoodEntry) {
    diary.dispatch(existing ? { type: 'update', id: existing.id, entry } : { type: 'add', date, entry });
    diary.dispatch({ type: 'select-date', date });
    exit();
  }

  return <>
    <Stack.Screen options={{ title: existing ? 'Editar registro' : 'Registro de alimento' }} />
    <FoodRegistrationScreen foods={__DEV__ && params.preview !== 'empty' ? foodsPreview : []}
      initial={{ meal: isMealId(params.meal) ? params.meal : 'lunch', entry: existing }} onExit={exit} onSave={save} />
  </>;
}
