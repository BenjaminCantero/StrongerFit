import { useLocalSearchParams, useRouter } from 'expo-router';
import { HomeScreen } from '../../features/home/HomeScreen';
import { createEmptyHome, homePreview } from '../../features/home/home.preview';
import { diaryTotals, entriesForDate, todayDateKey } from '../../features/nutrition/domain/diary';
import { useNutritionDiary } from '../../features/nutrition/useNutritionDiary';

export default function HomeRoute() {
  const router = useRouter();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const isPreview = __DEV__ && preview !== 'empty';
  const diary = useNutritionDiary();
  const consumed = diaryTotals(entriesForDate(diary, todayDateKey()));
  const targets = diary.targets;
  const overview = isPreview ? { ...homePreview, nutrition: targets ? {
    consumedKcal: consumed.kcal, targetKcal: targets.kcal,
    macros: ([['protein', 'Proteínas'], ['carbs', 'Carbos'], ['fat', 'Grasas']] as const)
      .map(([kind, name]) => ({ kind, name, consumed: consumed[kind], target: targets[kind] })),
  } : null } : createEmptyHome();

  return <HomeScreen overview={overview} isPreview={isPreview}
    onTrainingPress={() => router.navigate('/training')}
    onNutritionPress={() => isPreview ? router.push({ pathname: '/food-entry', params: { date: todayDateKey() } }) : router.navigate('/nutrition')} />;
}
