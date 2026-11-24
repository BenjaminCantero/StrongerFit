import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@strongerfit/contracts/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signedInUser } from '../../../../test/integration/users';
import { onboardingPayload } from '../../account/data/account.mappers';
import { completeOnboarding, createDraft, type Draft } from '../../onboarding/domain/onboarding';

let current: SupabaseClient<Database>;
vi.mock('../../../lib/supabase', () => ({ getSupabase: () => current }));
const { saveOnboarding } = await import('../../account/data/account.repository');
const { fetchIdentity, saveNutritionPreferences, savePersonal, saveTrainingSetup } = await import('./identity.repository');

const draft = (): Draft => ({
  ...createDraft(), name: 'Ana', age: '30', sex: 'female', height: '165', weight: '80', activity: 'moderate',
  goal: 'strength', level: 'beginner', days: '3', minutes: '45', environment: 'small-gym', equipment: ['dumbbells'],
  targetWeight: '76', weeks: '8', exclusions: 'maní', noHealthFlags: false, healthFlags: ['injury'], zones: ['knee'], disclaimerRead: true, consent: true,
});

async function onboard(client: SupabaseClient<Database>) {
  current = client;
  const result = completeOnboarding(draft(), new Date(), '2026-11-24');
  if (!result.ok) throw new Error('borrador inválido');
  await saveOnboarding(onboardingPayload(result, '2026-11-24'));
}

describe('repositorio de identidad contra Supabase local', () => {
  let a: Awaited<ReturnType<typeof signedInUser>>;

  beforeEach(async () => {
    a = await signedInUser();
    await onboard(a.client);
  });

  it('lee lo guardado en el onboarding', async () => {
    const identity = await fetchIdentity();
    expect(identity).toMatchObject({
      name: 'Ana', ageYears: 30, heightCm: 165, weightKg: 80, goal: 'Ganar fuerza', daysPerWeek: 3, exclusions: ['maní'],
      onboarding: { goal: 'strength', environment: 'small-gym', zones: ['knee'], healthFlags: ['injury'], weightGoal: { startKg: 80, targetKg: 76 } },
    });
  });

  it('editar la ficha conserva el historial de metas y registra el peso de hoy (RF-03)', async () => {
    const identity = await fetchIdentity();
    await savePersonal(identity, { name: 'Ana María', ageYears: 31, heightCm: 165, weightKg: 79.5, goal: '', daysPerWeek: 4, sessionMinutes: 45, equipment: '' },
      'muscle', '2026-11-25');
    const updated = await fetchIdentity();
    expect(updated).toMatchObject({ name: 'Ana María', ageYears: 31, weightKg: 79.5, daysPerWeek: 4, goal: 'Ganar masa muscular' });
    const { data: goals } = await a.client.from('user_goals').select('days_per_week').order('id');
    expect(goals).toEqual([{ days_per_week: 3 }, { days_per_week: 4 }]);
  });

  it('guarda preferencias alimentarias', async () => {
    await saveNutritionPreferences({ exclusions: ['gluten'], dietFocus: 'vegetariana', preferences: { mealsPerDay: 5, preferred: ['x'], disliked: [] },
      trainingDayTargets: true });
    expect(await fetchIdentity()).toMatchObject({ exclusions: ['gluten'], dietFocus: 'vegetariana', trainingDayTargets: true,
      mealPreferences: { mealsPerDay: 5, preferred: ['x'], disliked: [] } });
  });

  it('cambiar entorno y lesiones resuelve las quitadas sin borrarlas (RF-30)', async () => {
    await saveTrainingSetup(await fetchIdentity(), { environment: 'none', equipment: ['bodyweight'], zones: ['wrist'] });
    expect((await fetchIdentity()).onboarding).toMatchObject({ environment: 'none', equipment: ['bodyweight'], zones: ['wrist'] });
    const { data } = await a.client.from('user_injuries').select('zone, resolved_at').order('declared_at');
    expect(data?.map((row) => [row.zone, row.resolved_at !== null])).toEqual([['knee', true], ['wrist', false]]);
  });

  it('otra persona no ve la identidad de la primera (CA-01)', async () => {
    const b = await signedInUser();
    current = b.client;
    await expect(fetchIdentity()).rejects.toMatchObject({ kind: 'unknown' });
    const { data } = await b.client.from('user_goals').select('id');
    expect(data).toEqual([]);
  });
});
