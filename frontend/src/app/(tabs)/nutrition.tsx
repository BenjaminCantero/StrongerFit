import { useLocalSearchParams, useRouter } from 'expo-router';
import { NutritionScreen } from '../../features/nutrition/NutritionScreen';
import { entriesForDate, shiftDate, todayDateKey, type DiaryEntry } from '../../features/nutrition/domain/diary';
import type { MealId } from '../../features/nutrition/domain/food-entry';
import { weekdayIndex } from '../../features/nutrition/domain/meal-plan';
import { formatKcal } from '../../features/nutrition/presentation';
import { useNutritionDiary } from '../../features/nutrition/useNutritionDiary';
import { useProfile } from '../../features/profile/useProfile';

export default function NutritionRoute() {
  const router = useRouter();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const diary = useNutritionDiary();
  const empty = preview === 'empty';
  const { profile } = useProfile(empty);
  const todayPlan = profile.mealPlan?.days[weekdayIndex(todayDateKey())];
  function add(meal: MealId) {
    router.push({ pathname: '/food-entry', params: { meal, date: diary.selectedDate, ...(empty ? { preview: 'empty' } : {}) } });
  }
  function edit(entry: DiaryEntry) {
    router.push({ pathname: '/food-entry', params: { entryId: String(entry.id), date: entry.date } });
  }
  return <NutritionScreen date={diary.selectedDate} entries={empty ? [] : entriesForDate(diary)} targets={empty ? null : diary.targets}
    isPreview={__DEV__} onAdd={add} onEdit={edit}
    onDelete={(meal) => diary.dispatch({ type: 'delete-meal', date: diary.selectedDate, meal })}
    onMoveDate={(direction) => diary.dispatch({ type: 'select-date', date: shiftDate(diary.selectedDate, direction) })}
    onToday={() => diary.dispatch({ type: 'select-date', date: todayDateKey() })}
    onAdjustGoals={() => router.push('/nutrition-goals')} onMealPlan={() => router.push('/meal-plan')}
    mealPlanSummary={todayPlan ? `Guardada · Hoy ${formatKcal(todayPlan.totals.kcal)} kcal en 4 comidas` : null} />;
}
