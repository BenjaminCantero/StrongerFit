import type { HomeOverview } from './home.types';

// Fixture de diseño. Nunca se persiste ni se utiliza en el build de producción.
export const homePreview: HomeOverview = {
  firstName: 'Camila',
  date: new Date(),
  streakDays: 4,
  workout: {
    title: 'Rutina A: Tren Superior & Core',
    durationMinutes: 45,
    exercises: ['Press banca', 'Jalón al pecho', 'Plancha', 'Elevaciones'],
  },
  nutrition: {
    consumedKcal: 1420,
    targetKcal: 2100,
    macros: [
      { name: 'Proteínas', consumed: 95, target: 130, kind: 'protein' },
      { name: 'Carbos', consumed: 160, target: 220, kind: 'carbs' },
      { name: 'Grasas', consumed: 42, target: 60, kind: 'fat' },
    ],
  },
  adherence: {
    completedSessions: 3,
    targetSessions: 5,
    days: [
      { name: 'Lunes', label: 'L', state: 'completed' },
      { name: 'Martes', label: 'M', state: 'completed' },
      { name: 'Miércoles', label: 'X', state: 'completed' },
      { name: 'Jueves', label: 'J', state: 'current' },
      { name: 'Viernes', label: 'V', state: 'planned' },
      { name: 'Sábado', label: 'S', state: 'planned' },
      { name: 'Domingo', label: 'D', state: 'rest' },
    ],
  },
};

export function createEmptyHome(): HomeOverview {
  return { firstName: null, date: new Date(), streakDays: 0, workout: null, nutrition: null, adherence: null };
}
