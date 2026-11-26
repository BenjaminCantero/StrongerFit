import { useRouter } from 'expo-router';
import { MealPlanScreen } from '../features/nutrition/MealPlanScreen';
import { todayDateKey } from '../features/nutrition/domain/diary';
import { mealEntry, weekdayIndex } from '../features/nutrition/domain/meal-plan';
import { useDiaryWrite, useSaveMealPlan, useSwapMeals } from '../features/nutrition/useNutrition';
import { useNutritionDiary } from '../features/nutrition/useNutritionDiary';
import { useProfile } from '../features/profile/useProfile';
import { readMealPlan } from '@strongerfit/nutrition-engine';
import { weekStart } from '../shared/calendar';

export default function MealPlanRoute() {
  const router = useRouter();
  const { profile } = useProfile();
  const diary = useNutritionDiary();
  const save = useSaveMealPlan();
  const swap = useSwapMeals();
  const write = useDiaryWrite();
  const today = todayDateKey();
  const targetId = profile.nutritionPlan?.id;
  const current = profile.mealPlan;
  return <MealPlanScreen profile={profile} targets={diary.targets} todayIndex={weekdayIndex(today)}
    onSave={(plan) => { if (targetId) save.mutate({ plan: readMealPlan(plan), nutritionTargetId: targetId, weekStart: weekStart(today) }); }}
    onSwap={(plan) => { if (current?.id) swap.mutate({ planId: current.id, before: readMealPlan(current), after: readMealPlan(plan) }); }}
    onRegister={(day, slot) => {
      const meal = profile.mealPlan?.days[day]?.meals.find((item) => item.meal === slot);
      if (meal) write.mutate({ kind: 'add', date: today, entry: mealEntry(meal) });
    }}
    onGoals={() => router.push('/nutrition-goals')} onProfile={() => router.navigate('/profile')} />;
}
