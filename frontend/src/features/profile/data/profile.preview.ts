import type { ProfileData } from '../domain/profile';

// Fixture de diseño. Nunca se persiste ni se utiliza en el build de producción.
export const createProfilePreview = (): ProfileData => ({
  name: 'Camila Santander',
  photo: 'preview',
  ageYears: 29,
  heightCm: 168,
  weightKg: 71.4,
  goal: 'Ganancia de masa muscular y energía sostenible',
  daysPerWeek: 4,
  sessionMinutes: 50,
  equipment: 'Mancuernas ajustables, barra olímpica y banco plano',
  exclusions: ['Gluten'],
  dietFocus: 'Mediterránea adaptada, con legumbres, palta y pescados',
});
