export type MacroSummary = {
  name: string;
  consumed: number;
  target: number;
  kind: 'protein' | 'carbs' | 'fat';
};

export type WeekDay = {
  name: string;
  label: string;
  state: 'completed' | 'current' | 'planned' | 'rest';
};

export type HomeOverview = {
  firstName: string | null;
  date: Date;
  streakDays: number;
  workout: {
    title: string;
    durationMinutes: number;
    exercises: string[];
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
  } | null;
};
