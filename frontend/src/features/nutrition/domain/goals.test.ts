import { describe, expect, it } from 'vitest';
import { createProfilePreview } from '../../profile/data/profile.preview';
import { createEmptyProfile } from '../../profile/domain/profile';
import { calculateGoals, defaultSettings, goalPerson } from './goals';

describe('metas desde el perfil', () => {
  it('pide los datos faltantes en lugar de estimarlos', () => {
    expect(goalPerson(createEmptyProfile())).toEqual({ ok: false, missing: ['edad', 'altura', 'peso', 'sexo', 'actividad'] });
  });

  it('propone la dirección según el objetivo y respeta lo guardado', () => {
    const profile = createProfilePreview();
    expect(defaultSettings(profile)).toMatchObject({ direction: 'surplus', adjustment: 0.1, proteinPerKg: 1.6, fatShare: 0.25 });
    const person = goalPerson(profile);
    expect(person.ok).toBe(true);
    if (!person.ok) return;
    const result = calculateGoals(person.person, { ...defaultSettings(profile), direction: 'maintenance', adjustment: 0 });
    expect(defaultSettings({ ...profile, nutritionPlan: { proteinPerKg: 2, fatShare: 0.3, result, savedAt: '' } }))
      .toEqual({ direction: 'maintenance', adjustment: 0, proteinPerKg: 2, fatShare: 0.3 });
  });

  it('no propone déficit por defecto si hay condiciones de salud declaradas', () => {
    const profile = createProfilePreview();
    const risky = { ...profile, onboarding: { ...profile.onboarding!, goal: 'fat-loss' as const, healthFlags: ['injury' as const] } };
    expect(defaultSettings(risky).direction).toBe('maintenance');
    expect(defaultSettings({ ...risky, onboarding: { ...risky.onboarding, healthFlags: [] } }).direction).toBe('deficit');
  });
});
