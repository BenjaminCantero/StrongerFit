import { CONSENT_VERSION } from '../../onboarding/domain/onboarding';
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
  onboarding: {
    sex: 'female', activity: 'moderate', level: 'intermediate', goal: 'muscle', athleteProfile: 'strength-hypertrophy',
    equipment: ['dumbbells', 'barbell'], healthFlags: [],
    weightGoal: { startKg: 71.4, targetKg: 73, startDate: '2026-10-01', endDate: '2026-12-24' },
    consent: { version: CONSENT_VERSION, acceptedAt: '2026-10-01T12:00:00.000Z' }, completedAt: '2026-10-01T12:00:00.000Z',
  },
});
