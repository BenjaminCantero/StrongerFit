import { isMealId, sumNutrients, type FoodEntry, type MealId, type Nutrients } from './food-entry';
import { isDateKey, todayDateKey } from '../../../shared/calendar';
export { isDateKey, shiftDate, todayDateKey } from '../../../shared/calendar';

export type DiaryEntry = FoodEntry & { date: string };
export type DiaryState = {
  selectedDate: string;
  entries: DiaryEntry[];
  targets: Nutrients | null;
  nextId: number;
};
export type DiaryAction =
  | { type: 'select-date'; date: string }
  | { type: 'add'; date: string; entry: FoodEntry }
  | { type: 'update'; id: number; entry: FoodEntry }
  | { type: 'delete-meal'; date: string; meal: MealId };

export function entriesForDate(state: DiaryState, date = state.selectedDate): DiaryEntry[] {
  return state.entries.filter((entry) => entry.date === date);
}

export function diaryTotals(entries: readonly FoodEntry[]): Nutrients {
  return sumNutrients(entries.map((entry) => entry.nutrients));
}

function validEntry(entry: FoodEntry): boolean {
  return isMealId(entry.meal) && entry.items.length > 0 && entry.items.every((item) => Number.isFinite(item.grams) && item.grams > 0
    && Object.values(item.nutrients).every((value) => Number.isFinite(value) && value >= 0));
}

function snapshot(entry: FoodEntry, id: number, date: string): DiaryEntry {
  const items = entry.items.map((item) => ({ ...item, nutrients: { ...item.nutrients } }));
  return { id, date, meal: entry.meal, items, nutrients: sumNutrients(items.map((item) => item.nutrients)) };
}

export function diaryReducer(state: DiaryState, action: DiaryAction): DiaryState {
  switch (action.type) {
    case 'select-date': return isDateKey(action.date) ? { ...state, selectedDate: action.date } : state;
    case 'add':
      return isDateKey(action.date) && validEntry(action.entry)
        ? { ...state, entries: [...state.entries, snapshot(action.entry, state.nextId, action.date)], nextId: state.nextId + 1 } : state;
    case 'update': {
      const existing = state.entries.find((entry) => entry.id === action.id);
      return existing && validEntry(action.entry)
        ? { ...state, entries: state.entries.map((entry) => entry.id === action.id ? snapshot(action.entry, entry.id, entry.date) : entry) } : state;
    }
    case 'delete-meal':
      return { ...state, entries: state.entries.filter((entry) => entry.date !== action.date || entry.meal !== action.meal) };
  }
}

export function createEmptyDiary(date = todayDateKey()): DiaryState {
  return { selectedDate: date, entries: [], targets: null, nextId: 1 };
}
