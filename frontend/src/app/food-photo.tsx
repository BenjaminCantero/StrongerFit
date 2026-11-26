import { useLocalSearchParams, useRouter } from 'expo-router';
import { FoodPhotoScreen } from '../features/nutrition/FoodPhotoScreen';
import { isDateKey } from '../features/nutrition/domain/diary';
import { isMealId, type FoodEntry } from '../features/nutrition/domain/food-entry';
import { previewFoodPhotoAnalyzer } from '../features/nutrition/photo-analyzer';
import { pickFoodPhoto } from '../features/nutrition/photo-picker';
import { useNutritionDiary } from '../features/nutrition/useNutritionDiary';
import { useDiaryWrite } from '../features/nutrition/useNutrition';

export default function FoodPhotoRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; meal?: string }>();
  const diary = useNutritionDiary();
  const write = useDiaryWrite();
  const date = isDateKey(params.date) ? params.date : diary.selectedDate;
  const exit = () => router.dismissTo('/nutrition');

  function save(entry: FoodEntry) {
    write.mutate({ kind: 'add', date, entry });
    diary.dispatch({ type: 'select-date', date });
    exit();
  }

  // Hasta conectar el backend, solo desarrollo usa el analizador simulado.
  return <FoodPhotoScreen analyzer={__DEV__ ? previewFoodPhotoAnalyzer : null} pickPhoto={pickFoodPhoto}
    initialMeal={isMealId(params.meal) ? params.meal : undefined} isPreview={__DEV__} onExit={exit} onSave={save} />;
}
