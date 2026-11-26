import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@strongerfit/contracts/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signedInUser } from '../../../../test/integration/users';
import { completeOnboarding, createDraft, CONSENT_VERSION, type Draft } from '../../onboarding/domain/onboarding';
import { onboardingPayload } from './account.mappers';

// El repositorio usa getSupabase(); aquí apunta al cliente de la persona de cada prueba.
let current: SupabaseClient<Database>;
vi.mock('../../../lib/supabase', () => ({ getSupabase: () => current }));
const { fetchAccountStatus, recordConsent, saveOnboarding } = await import('./account.repository');

const draft = (): Draft => ({
  ...createDraft(), name: 'Ana', age: '30', sex: 'female', height: '165', weight: '80', activity: 'moderate',
  goal: 'strength', level: 'beginner', days: '3', minutes: '45', environment: 'small-gym', equipment: ['dumbbells'],
  targetWeight: '76', weeks: '8', noHealthFlags: false, healthFlags: ['injury'], zones: ['knee'], disclaimerRead: true, consent: true,
});

function payload() {
  const result = completeOnboarding(draft(), new Date(), '2026-11-24');
  if (!result.ok) throw new Error('borrador inválido');
  return onboardingPayload(result, '2026-11-24');
}

describe('repositorio de cuenta contra Supabase local', () => {
  let a: Awaited<ReturnType<typeof signedInUser>>;
  let b: Awaited<ReturnType<typeof signedInUser>>;

  beforeEach(async () => {
    [a, b] = await Promise.all([signedInUser(), signedInUser()]);
  });

  it('una cuenta nueva necesita onboarding', async () => {
    current = a.client;
    expect(await fetchAccountStatus()).toBe('needs-onboarding');
  });

  it('el onboarding deja la cuenta lista y un reintento no duplica', async () => {
    current = a.client;
    expect(await saveOnboarding(payload())).toBe(true);
    expect(await fetchAccountStatus()).toBe('ready');
    expect(await saveOnboarding(payload())).toBe(false);
    const { data } = await a.client.from('user_injuries').select('zone');
    expect(data).toEqual([{ zone: 'knee' }]);
  });

  it('otra persona no ve el perfil ni los datos de la primera (CA-01)', async () => {
    current = a.client;
    await saveOnboarding(payload());
    current = b.client;
    expect(await fetchAccountStatus()).toBe('needs-onboarding');
    const { data } = await b.client.from('profiles').select('user_id');
    expect(data).toEqual([]);
  });

  it('retirar el consentimiento lo pide de nuevo y otorgarlo lo restablece (CA-11)', async () => {
    current = a.client;
    await saveOnboarding(payload());
    await recordConsent('withdrawn', CONSENT_VERSION);
    expect(await fetchAccountStatus()).toBe('needs-consent');
    await expect(a.client.from('profiles').update({ height_cm: 170 }).eq('user_id', a.id).throwOnError()).rejects.toMatchObject({ code: '42501' });
    await recordConsent('granted', CONSENT_VERSION);
    expect(await fetchAccountStatus()).toBe('ready');
  });
});

describe('onboarding pendiente guardado tras crear la cuenta (AU-01)', () => {
  it('guarda el perfil en la cuenta nueva y un segundo guardado no cambia nada', async () => {
    const user = await signedInUser();
    current = user.client;
    expect(await fetchAccountStatus()).toBe('needs-onboarding');

    const pending = payload();
    expect(await saveOnboarding(pending)).toBe(true);
    expect(await fetchAccountStatus()).toBe('ready');

    const other = completeOnboarding({ ...draft(), name: 'Otra' }, new Date(), '2026-11-24');
    if (!other.ok) throw new Error('borrador inválido');
    expect(await saveOnboarding(onboardingPayload(other, '2026-11-24'))).toBe(false);
    const { data } = await user.client.from('profiles').select('display_name').single();
    expect(data?.display_name).toBe('Ana');
    expect(await fetchAccountStatus()).toBe('ready');
  });
});
