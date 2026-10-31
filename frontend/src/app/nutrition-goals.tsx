import { useRouter } from 'expo-router';
import { NutritionGoalsScreen } from '../features/nutrition/NutritionGoalsScreen';
import { useNutritionDiary } from '../features/nutrition/useNutritionDiary';
import { useProfile } from '../features/profile/useProfile';

export default function NutritionGoalsRoute() {
  const router = useRouter();
  const { profile, dispatch } = useProfile();
  const diary = useNutritionDiary();
  return <NutritionGoalsScreen profile={profile} onEditProfile={() => router.navigate('/profile')}
    onSave={(settings, result) => {
      dispatch({ type: 'set-nutrition-plan', plan: { proteinPerKg: settings.proteinPerKg, fatShare: settings.fatShare, result, savedAt: new Date().toISOString() } });
      diary.dispatch({ type: 'set-targets', targets: { kcal: result.kcal, protein: result.protein, carbs: result.carbs, fat: result.fat } });
      router.back();
    }} />;
}
