import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { features } from '../shared/features';
import { BarcodeScreen } from '../features/nutrition/BarcodeScreen';
import { isDateKey } from '../features/nutrition/domain/diary';
import { isMealId, type FoodEntry } from '../features/nutrition/domain/food-entry';
import { lookupProduct } from '../features/nutrition/openfoodfacts';
import { useNutritionDiary } from '../features/nutrition/useNutritionDiary';
import { useDiaryWrite } from '../features/nutrition/useNutrition';

function BarcodeRouteContent() {
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

  return <BarcodeScreen lookup={lookupProduct} initialMeal={isMealId(params.meal) ? params.meal : 'snack'} onSave={save} onExit={exit}
    onManual={(meal) => router.replace({ pathname: '/food-entry', params: { meal, date } })} />;
}

// Oculta en la v0 (SRS 1.3): el código se conserva tras el flag.
export default function BarcodeRoute() {
  return features.barcode ? <BarcodeRouteContent /> : <Redirect href="/nutrition" />;
}
