import { useRouter } from 'expo-router';
import { MealPlanScreen } from '../features/nutrition/MealPlanScreen';
import { todayDateKey } from '../features/nutrition/domain/diary';
import { mealEntry, weekdayIndex } from '../features/nutrition/domain/meal-plan';
import { useNutritionDiary } from '../features/nutrition/useNutritionDiary';
import { useProfile } from '../features/profile/useProfile';

export default function MealPlanRoute() {
  const router = useRouter();
  const { profile, dispatch } = useProfile();
  const diary = useNutritionDiary();
  const today = todayDateKey();
  return <MealPlanScreen profile={profile} targets={diary.targets} todayIndex={weekdayIndex(today)}
    onSave={(plan) => dispatch({ type: 'set-meal-plan', plan })}
    onRegister={(day, slot) => {
      const meal = profile.mealPlan?.days[day]?.meals.find((item) => item.meal === slot);
      if (meal) diary.dispatch({ type: 'add', date: today, entry: mealEntry(meal) });
    }}
    onGoals={() => router.push('/nutrition-goals')} onProfile={() => router.navigate('/profile')} />;
}
