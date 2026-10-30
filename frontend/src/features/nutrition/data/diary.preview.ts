import { diaryReducer, todayDateKey, type DiaryState } from '../domain/diary';
import { nutrientsForGrams, sumNutrients, type FoodEntry, type MealId } from '../domain/food-entry';
import { foodsPreview } from './foods.preview';

export function createPreviewDiary(date = todayDateKey()): DiaryState {
  let state: DiaryState = { selectedDate: date, entries: [], targets: { kcal: 2100, protein: 130, carbs: 220, fat: 60 }, nextId: 1 };
  function add(meal: MealId, quantities: [string, number][]) {
    const items = quantities.map(([id, grams]) => {
      const food = foodsPreview.find((item) => item.id === id)!;
      return { foodId: id, name: food.name, grams, nutrients: nutrientsForGrams(food, grams) };
    });
    const entry: FoodEntry = { id: 0, meal, items, nutrients: sumNutrients(items.map((item) => item.nutrients)) };
    state = diaryReducer(state, { type: 'add', date, entry });
  }
  add('breakfast', [['oats', 180], ['walnuts', 20]]);
  add('lunch', [['chicken', 150], ['quinoa', 120], ['avocado', 50]]);
  return state;
}
