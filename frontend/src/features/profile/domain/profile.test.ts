import { describe, expect, it } from 'vitest';
import { createProfilePreview } from '../data/profile.preview';
import { buildLocalExport, createEmptyProfile, createMealPreferences, isProfileEmpty, MAX_FOOD_PREFERENCES, nutritionForm, parseNutritionForm, parsePersonalForm,
  personalForm, profileReducer, toggleFoodPreference } from './profile';

const form = () => personalForm(createProfilePreview());

describe('ficha personal', () => {
  it('convierte el perfil a formulario y vuelve a los mismos valores', () => {
    const preview = createProfilePreview();
    expect(form().weight).toBe('71,4');
    const parsed = parsePersonalForm(form());
    expect(parsed.ok && profileReducer(preview, { type: 'update-personal', values: parsed.values })).toEqual(preview);
  });

  it('acepta campos numéricos vacíos y normaliza espacios', () => {
    const parsed = parsePersonalForm({ ...personalForm(createEmptyProfile()), name: '  Ana   María ', weight: '70.5' });
    expect(parsed).toEqual({ ok: true, values: expect.objectContaining({ name: 'Ana María', weightKg: 70.5, ageYears: null, heightCm: null }) });
  });

  it('rechaza menores de edad, valores fuera de rango y formatos ambiguos', () => {
    const parsed = parsePersonalForm({ ...form(), name: ' ', age: '17', height: '1,68', weight: '71,45', days: '8', minutes: '1e2' });
    expect(parsed.ok).toBe(false);
    expect(!parsed.ok && Object.keys(parsed.errors).sort()).toEqual(['age', 'days', 'height', 'minutes', 'name', 'weight']);
    expect(parsePersonalForm({ ...form(), age: '18', weight: '300' }).ok).toBe(true);
  });
});

describe('preferencias de la minuta', () => {
  it('parte con 4 comidas y sin preferencias, y se guardan junto a las exclusiones', () => {
    expect(createEmptyProfile().mealPreferences).toEqual({ mealsPerDay: 4, preferred: [], disliked: [] });
    const preferences = { mealsPerDay: 5 as const, preferred: ['salmon'], disliked: ['tuna'] };
    const next = profileReducer(createProfilePreview(), { type: 'update-nutrition', exclusions: ['maní'], dietFocus: '', preferences });
    expect(next).toMatchObject({ exclusions: ['maní'], mealPreferences: preferences });
    expect(profileReducer(next, { type: 'update-nutrition', exclusions: [], dietFocus: '' }).mealPreferences).toBe(preferences);
  });

  it('un alimento no puede ser preferido y no deseado a la vez, y cada lista tiene un máximo', () => {
    let preferences = toggleFoodPreference(createMealPreferences(), 'preferred', 'rice');
    expect(preferences.preferred).toEqual(['rice']);
    preferences = toggleFoodPreference(preferences, 'disliked', 'rice');
    expect(preferences).toMatchObject({ preferred: [], disliked: ['rice'] });
    expect(toggleFoodPreference(preferences, 'disliked', 'rice').disliked).toEqual([]);
    const full = { ...preferences, preferred: Array.from({ length: MAX_FOOD_PREFERENCES }, (_, index) => `food-${index}`) };
    expect(toggleFoodPreference(full, 'preferred', 'chicken')).toBe(full);
  });
});

describe('nutrición y restricciones', () => {
  it('separa exclusiones, quita duplicados y conserva el orden', () => {
    expect(parseNutritionForm({ exclusions: 'Gluten, maní;\ngluten, , Lactosa', dietFocus: ' Mediterránea ' }))
      .toEqual({ ok: true, exclusions: ['Gluten', 'maní', 'Lactosa'], dietFocus: 'Mediterránea' });
    expect(nutritionForm(createProfilePreview()).exclusions).toBe('Gluten');
  });

  it('limita la cantidad y el largo de las exclusiones', () => {
    expect(parseNutritionForm({ exclusions: Array.from({ length: 11 }, (_, i) => `a${i}`).join(','), dietFocus: '' }).ok).toBe(false);
    expect(parseNutritionForm({ exclusions: 'x'.repeat(41), dietFocus: '' }).ok).toBe(false);
  });
});

describe('foto, eliminación y exportación', () => {
  it('cambia o quita la foto y elimina todo el perfil local', () => {
    const preview = createProfilePreview();
    expect(profileReducer(preview, { type: 'set-photo', photo: { uri: 'file:///a.jpg' } }).photo).toEqual({ uri: 'file:///a.jpg' });
    expect(profileReducer(preview, { type: 'set-photo', photo: null }).photo).toBeNull();
    expect(isProfileEmpty(profileReducer(preview, { type: 'reset' }))).toBe(true);
    expect(isProfileEmpty(preview)).toBe(false);
  });

  it('exporta datos estructurados sin la ruta de la foto y rotula los ejemplos', () => {
    const profile = { ...createProfilePreview(), photo: { uri: 'file:///private/photo.jpg' } };
    const result = buildLocalExport({ profile, exportedAt: new Date('2026-10-30T22:00:00Z'), isPreview: true, progress: { workouts: [] } });
    expect(result).toMatchObject({ exportedAt: '2026-10-30T22:00:00.000Z', sampleData: true, progress: { workouts: [] },
      profile: { name: 'Camila Santander', hasPhoto: true } });
    expect(JSON.stringify(result)).not.toContain('photo.jpg');
  });
});
