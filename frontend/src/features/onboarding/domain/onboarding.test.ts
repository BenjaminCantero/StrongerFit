import { describe, expect, it } from 'vitest';
import { createEmptyProfile, profileReducer } from '../../profile/domain/profile';
import { completeOnboarding, createDraft, hasHealthRisk, validateStep, weightGoalPace, type Draft } from './onboarding';

const today = '2026-10-30';
const valid = (): Draft => ({
  ...createDraft(), name: 'Ana', age: '30', sex: 'female', height: '165', weight: '80', activity: 'moderate',
  goal: 'fat-loss', level: 'beginner', days: '3', minutes: '45', environment: 'none', equipment: [],
  targetWeight: '76', weeks: '8', exclusions: 'maní', noHealthFlags: true, disclaimerRead: true, consent: true,
});

describe('onboarding', () => {
  it('calcula el ritmo del objetivo de peso según el ejemplo del SRS (CA-21)', () => {
    const pace = weightGoalPace(80, 76, 8);
    expect(pace.kgPerWeek).toBe(-0.5);
    expect(pace.percentPerWeek).toBeCloseTo(0.625);
    expect(pace.exceeds).toBe(false);
  });

  it('pide confirmación si el ritmo supera 1 % del peso inicial por semana (BR-20)', () => {
    const draft = { ...valid(), targetWeight: '70', weeks: '8' };
    expect(validateStep('weight', draft)).toHaveProperty('paceConfirmed');
    expect(validateStep('weight', { ...draft, paceConfirmed: true })).toEqual({});
    expect(validateStep('weight', { ...draft, setWeightGoal: false })).toEqual({});
  });

  it('no avanza sin aviso de salud, respuesta de aptitud y consentimiento (CA-11)', () => {
    const errors = validateStep('health', { ...valid(), consent: false, disclaimerRead: false, noHealthFlags: false });
    expect(Object.keys(errors).sort()).toEqual(['consent', 'disclaimerRead', 'healthFlags']);
    expect(completeOnboarding({ ...valid(), consent: false }, new Date(), today)).toEqual({ ok: false, step: 'health' });
  });

  it('exige los datos para estimar metas, el entorno y los días cubiertos (RF-31)', () => {
    expect(Object.keys(validateStep('basics', { ...valid(), age: '', sex: null, activity: null })).sort()).toEqual(['activity', 'age', 'sex']);
    expect(validateStep('training', { ...valid(), days: '7' })).toHaveProperty('days');
    expect(validateStep('training', { ...valid(), days: '6' })).toEqual({});
    expect(validateStep('training', { ...valid(), environment: null })).toHaveProperty('environment');
  });

  it('solo las condiciones clínicas son riesgo; la lesión afecta la rutina (BR-19, RF-30)', () => {
    expect(hasHealthRisk(['injury'])).toBe(false);
    expect(hasHealthRisk(['injury', 'cardiovascular'])).toBe(true);
    expect(hasHealthRisk(['pregnancy'])).toBe(true);
    expect(hasHealthRisk(['eating-disorder'])).toBe(true);
    expect(hasHealthRisk([])).toBe(false);
  });

  it('pide zonas si se declara una lesión (RF-30)', () => {
    const injured = { ...valid(), healthFlags: ['injury' as const], noHealthFlags: false };
    expect(validateStep('health', injured)).toHaveProperty('zones');
    expect(validateStep('health', { ...injured, zones: ['knee' as const] })).toEqual({});
  });

  it('guarda el perfil completo con consentimiento versionado y objetivo de peso fechado', () => {
    const now = new Date('2026-10-30T15:00:00Z');
    const result = completeOnboarding({ ...valid(), healthFlags: ['injury'], zones: ['knee', 'wrist'], noHealthFlags: false }, now, today);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const profile = profileReducer(createEmptyProfile(), { type: 'complete-onboarding', ...result });
    expect(profile).toMatchObject({ name: 'Ana', weightKg: 80, goal: 'Reducir grasa corporal', equipment: 'Sin equipo', exclusions: ['maní'] });
    expect(profile.onboarding).toMatchObject({ healthFlags: ['injury'], zones: ['knee', 'wrist'], environment: 'none', equipment: ['bodyweight'], completedAt: now.toISOString(),
      weightGoal: { startKg: 80, targetKg: 76, startDate: today, endDate: '2026-12-25' } });
    expect(profile.onboarding?.consent.acceptedAt).toBe(now.toISOString());
    expect(profile.mealPreferences).toEqual({ mealsPerDay: 4, preferred: [], disliked: [] });
    expect(profile).not.toHaveProperty('ok');
  });
});
