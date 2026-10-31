export type MacroSummary = {
  name: string;
  consumed: number;
  target: number;
  kind: 'protein' | 'carbs' | 'fat';
};

export type WeekDay = {
  name: string;
  label: string;
  state: 'completed' | 'current' | 'missed' | 'upcoming';
};

export type HomeOverview = {
  firstName: string | null;
  date: Date;
  activeWeeks: number;
  workout: {
    day: number;
    title: string;
    durationMinutes: number;
    exercises: string[];
    doneToday: boolean;
  } | null;
  nutrition: {
    consumedKcal: number;
    targetKcal: number;
    macros: MacroSummary[];
  } | null;
  adherence: {
    completedSessions: number;
    targetSessions: number;
    days: WeekDay[];
    last: { name: string; date: string; durationMinutes: number; volumeKg: number } | null;
  } | null;
  weight: {
    startKg: number;
    currentKg: number;
    targetKg: number;
    endDate: string;
    progress: number;
    weeksLeft: number;
  } | null;
};
