import { z } from 'zod';
import { db } from '../../../lib/data/client';
import { unwrap } from '../../../lib/data/errors';
import { accountStatus, OnboardingPayloadSchema, type AccountStatus, type OnboardingPayload } from './account.mappers';

const ConsentAction = z.enum(['granted', 'withdrawn']).nullable();

// Estado que decide las rutas (AU-01): ¿hay perfil y consentimiento vigente?
export async function fetchAccountStatus(): Promise<AccountStatus> {
  const [profile, consent] = await Promise.all([
    db().from('profiles').select('user_id').maybeSingle(),
    db().from('current_consents').select('action').eq('kind', 'health-data').maybeSingle(),
  ]);
  return accountStatus({ hasProfile: unwrap(profile) !== null, consent: ConsentAction.parse(unwrap(consent)?.action ?? null) });
}

// Guarda el onboarding completo en una transacción. Devuelve false si ya estaba guardado.
export async function saveOnboarding(payload: OnboardingPayload): Promise<boolean> {
  const data = unwrap(await db().rpc('complete_onboarding', { payload: OnboardingPayloadSchema.parse(payload) }));
  return z.boolean().parse(data);
}

// Otorgar o retirar el consentimiento agrega un registro; nunca se edita el anterior (CA-11).
export async function recordConsent(action: 'granted' | 'withdrawn', policyVersion: string): Promise<void> {
  unwrap(await db().from('consents').insert({ kind: 'health-data', policy_version: policyVersion, action }));
}
