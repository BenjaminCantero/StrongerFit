import { describe, expect, it } from 'vitest';
import { completeOnboarding, createDraft, HEALTH_QUESTIONNAIRE_VERSION, type Draft } from '../../onboarding/domain/onboarding';
import { accountStatus, deletionNotice, formatDeletionDate, onboardingPayload, parseAccountDeletion } from './account.mappers';

const valid = (overrides: Partial<Draft> = {}): Draft => ({
  ...createDraft(), name: 'Ana', age: '30', sex: 'female', height: '165', weight: '80', activity: 'moderate',
  goal: 'fat-loss', level: 'beginner', days: '3', minutes: '45', environment: 'small-gym', equipment: ['dumbbells'],
  targetWeight: '76', weeks: '8', exclusions: 'maní', noHealthFlags: true, disclaimerRead: true, consent: true, ...overrides,
});

function payloadFor(draft: Draft) {
  const result = completeOnboarding(draft, new Date('2026-11-24T10:00:00Z'), '2026-11-24');
  if (!result.ok) throw new Error(`borrador inválido en el paso ${result.step}`);
  return onboardingPayload(result, '2026-11-24');
}

describe('onboardingPayload', () => {
  it('traduce el onboarding completo al payload de complete_onboarding', () => {
    const payload = payloadFor(valid());
    expect(payload).toMatchObject({
      consent_version: 'consentimiento-salud-v0.1',
      questionnaire_version: HEALTH_QUESTIONNAIRE_VERSION,
      health_flags: [],
      disclaimer_accepted_at: '2026-11-24T10:00:00.000Z',
      profile: { display_name: 'Ana', sex: 'female', age_years: 30, height_cm: 165, activity: 'moderate' },
      goal: { goal: 'fat-loss', level: 'beginner', environment: 'small-gym', equipment: ['bodyweight', 'dumbbells'], days_per_week: 3, session_minutes: 45 },
      preferences: { meals_per_day: 4, preferred_food_ids: [], disliked_food_ids: [], diet_focus: '', training_day_targets: false },
      injuries: [],
      weight: { measured_on: '2026-11-24', weight_kg: 80 },
      weight_goal: { start_kg: 80, target_kg: 76, start_date: '2026-11-24', end_date: '2027-01-19', pace_confirmed: false },
    });
    expect(payload.preferences.exclusions).toHaveLength(1);
  });

  it('marca el ritmo como confirmado cuando supera 1 % semanal (BR-20)', () => {
    const payload = payloadFor(valid({ targetWeight: '70', weeks: '8', paceConfirmed: true }));
    expect(payload.weight_goal?.pace_confirmed).toBe(true);
  });

  it('envía lesiones y respuestas del cuestionario', () => {
    const payload = payloadFor(valid({ noHealthFlags: false, healthFlags: ['injury', 'pregnancy'], zones: ['knee'] }));
    expect(payload.health_flags).toEqual(['injury', 'pregnancy']);
    expect(payload.injuries).toEqual(['knee']);
  });

  it('sin objetivo de peso no envía weight_goal', () => {
    const payload = payloadFor(valid({ setWeightGoal: false }));
    expect(payload.weight_goal).toBeNull();
  });
});

describe('accountStatus', () => {
  it('sin perfil falta el onboarding', () => {
    expect(accountStatus({ hasProfile: false, consent: null })).toBe('needs-onboarding');
    expect(accountStatus({ hasProfile: false, consent: 'granted' })).toBe('needs-onboarding');
  });

  it('con perfil y consentimiento retirado falta el consentimiento (CA-11)', () => {
    expect(accountStatus({ hasProfile: true, consent: 'withdrawn' })).toBe('needs-consent');
    expect(accountStatus({ hasProfile: true, consent: null })).toBe('needs-consent');
  });

  it('con perfil y consentimiento vigente está lista', () => {
    expect(accountStatus({ hasProfile: true, consent: 'granted' })).toBe('ready');
  });
});

describe('eliminación de cuenta', () => {
  it('valida la respuesta del servidor con el contrato', () => {
    expect(parseAccountDeletion({ status: 'none' })).toEqual({ status: 'none' });
    expect(parseAccountDeletion({ status: 'pending', scheduledFor: '2026-12-01T15:00:00.000Z' }))
      .toEqual({ status: 'pending', scheduledFor: '2026-12-01T15:00:00.000Z' });
    expect(() => parseAccountDeletion({ status: 'pending' })).toThrow();
    expect(() => parseAccountDeletion({ status: 'pending', scheduledFor: 'mañana' })).toThrow();
    expect(() => parseAccountDeletion(null)).toThrow();
  });

  it('formatea la fecha en hora de Chile', () => {
    expect(formatDeletionDate('2026-12-01T15:00:00.000Z')).toBe('1 de diciembre de 2026');
    // 02:00 UTC del 2 aún es el día 1 en Santiago (UTC-3 en verano).
    expect(formatDeletionDate('2026-12-02T02:00:00.000Z')).toBe('1 de diciembre de 2026');
  });

  it('arma el aviso con la fecha', () => {
    expect(deletionNotice('2026-12-01T15:00:00.000Z'))
      .toBe('Tu cuenta se eliminará el 1 de diciembre de 2026. Puedes cancelarlo entrando de nuevo antes de esa fecha.');
  });
});
