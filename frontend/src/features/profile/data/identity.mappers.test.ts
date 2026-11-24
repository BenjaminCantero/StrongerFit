import { describe, expect, it } from 'vitest';
import { identityFromRows, personalWrites, trainingSetupWrites, type IdentityRows } from './identity.mappers';

const rows = (overrides: Partial<IdentityRows> = {}): IdentityRows => ({
  profile: { user_id: 'u1', display_name: 'Ana', sex: 'female', age_years: 30, height_cm: 165, activity: 'moderate', units: 'metric',
    created_at: '2026-11-24T10:00:00Z', updated_at: '2026-11-24T10:00:00Z' },
  goal: { id: 2, user_id: 'u1', goal: 'strength', level: 'beginner', environment: 'small-gym', equipment: ['bodyweight', 'dumbbells'],
    days_per_week: 3, session_minutes: 45, created_at: '2026-11-24T10:00:00Z' },
  preferences: { user_id: 'u1', meals_per_day: 5, preferred_food_ids: ['a'], disliked_food_ids: ['b'], exclusions: ['maní'], diet_focus: 'mediterránea',
    training_day_targets: true, created_at: '', updated_at: '' },
  injuries: [{ id: 'i1', user_id: 'u1', zone: 'knee', declared_at: '', resolved_at: null, updated_at: '' }],
  screening: { id: 1, user_id: 'u1', questionnaire_version: 'aptitud-v0.1', flags: ['injury'], has_risk: false,
    disclaimer_accepted_at: '2026-11-24T10:00:00Z', created_at: '' },
  consent: { id: 1, user_id: 'u1', kind: 'health-data', policy_version: 'consentimiento-salud-v0.1', action: 'granted', at: '2026-11-24T10:00:00Z' },
  latestWeight: { weight_kg: 70.5, measured_on: '2026-11-24' },
  weightGoal: { id: 'g1', user_id: 'u1', start_kg: 70.5, target_kg: 66, start_date: '2026-11-24', end_date: '2027-03-16', pace_confirmed: false,
    status: 'active', created_at: '', updated_at: '' },
  ...overrides,
});

describe('identityFromRows', () => {
  it('arma la parte de identidad del perfil desde las tablas', () => {
    expect(identityFromRows(rows())).toEqual({
      name: 'Ana', ageYears: 30, heightCm: 165, weightKg: 70.5, goal: 'Ganar fuerza', daysPerWeek: 3, sessionMinutes: 45,
      equipment: 'Gimnasio pequeño', exclusions: ['maní'], dietFocus: 'mediterránea',
      mealPreferences: { mealsPerDay: 5, preferred: ['a'], disliked: ['b'] }, trainingDayTargets: true,
      onboarding: {
        sex: 'female', activity: 'moderate', level: 'beginner', goal: 'strength', environment: 'small-gym', equipment: ['bodyweight', 'dumbbells'],
        zones: ['knee'], healthFlags: ['injury'], weightGoal: { startKg: 70.5, targetKg: 66, startDate: '2026-11-24', endDate: '2027-03-16' },
        consent: { version: 'consentimiento-salud-v0.1', acceptedAt: '2026-11-24T10:00:00Z' }, completedAt: '2026-11-24T10:00:00Z',
      },
    });
  });

  it('sin pesaje ni objetivo de peso deja esos campos vacíos', () => {
    const identity = identityFromRows(rows({ latestWeight: null, weightGoal: null }));
    expect(identity.weightKg).toBeNull();
    expect(identity.onboarding.weightGoal).toBeNull();
  });

  it('rechaza un valor que la app no conoce', () => {
    expect(() => identityFromRows(rows({ profile: { ...rows().profile, sex: 'otro' } }))).toThrow();
  });
});

describe('personalWrites', () => {
  const current = identityFromRows(rows());
  const values = { name: 'Ana María', ageYears: 31, heightCm: 165, weightKg: 70.5, goal: '', daysPerWeek: 3, sessionMinutes: 45, equipment: '' };

  it('solo edita el perfil si no cambia la meta ni el peso', () => {
    expect(personalWrites(current, values, 'strength', '2026-11-25')).toEqual({
      profile: { display_name: 'Ana María', age_years: 31, height_cm: 165 }, goal: null, weight: null,
    });
  });

  it('agrega una meta nueva conservando el entorno si cambian días o el objetivo (RF-03)', () => {
    const writes = personalWrites(current, { ...values, daysPerWeek: 4 }, 'muscle', '2026-11-25');
    expect(writes.goal).toEqual({ goal: 'muscle', level: 'beginner', environment: 'small-gym', equipment: ['bodyweight', 'dumbbells'],
      days_per_week: 4, session_minutes: 45 });
  });

  it('registra un pesaje de hoy si cambia el peso', () => {
    expect(personalWrites(current, { ...values, weightKg: 69.8 }, 'strength', '2026-11-25').weight)
      .toEqual({ measured_on: '2026-11-25', weight_kg: 69.8 });
  });
});

describe('trainingSetupWrites', () => {
  const current = identityFromRows(rows());

  it('agrega una meta con el nuevo entorno y calcula altas y bajas de lesiones', () => {
    expect(trainingSetupWrites(current, { environment: 'none', equipment: ['bodyweight'], zones: ['wrist'] })).toEqual({
      goal: { goal: 'strength', level: 'beginner', environment: 'none', equipment: ['bodyweight'], days_per_week: 3, session_minutes: 45 },
      addZones: ['wrist'], resolveZones: ['knee'],
    });
  });

  it('sin cambios de entorno no crea meta nueva', () => {
    expect(trainingSetupWrites(current, { environment: 'small-gym', equipment: ['bodyweight', 'dumbbells'], zones: ['knee'] }))
      .toEqual({ goal: null, addZones: [], resolveZones: [] });
  });
});
