import { z } from 'zod';
import { apiUrl } from '../../../lib/env';
import { db } from '../../../lib/data/client';
import { DataError, unwrap } from '../../../lib/data/errors';
import { getSupabase } from '../../../lib/supabase';
import { accountStatus, OnboardingPayloadSchema, parseAccountDeletion, type AccountDeletion, type AccountStatus, type OnboardingPayload } from './account.mappers';

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

async function deletionRequest(path: string, method: 'GET' | 'POST'): Promise<Response> {
  const token = (await getSupabase().auth.getSession()).data.session?.access_token;
  if (!token) throw new DataError('session');
  try {
    return await fetch(`${apiUrl.replace(/\/$/, '')}${path}`, { method, headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new DataError('offline');
  }
}

// Estado de la solicitud de eliminación: si hay una abierta, la cuenta queda bloqueada hasta cancelarla.
export async function fetchAccountDeletion(): Promise<AccountDeletion> {
  const response = await deletionRequest('/v1/me/deletion', 'GET');
  if (response.status === 401) throw new DataError('session');
  if (!response.ok) throw new DataError('unknown', 'No pudimos revisar el estado de tu cuenta. Inténtalo de nuevo.');
  return parseAccountDeletion(await response.json());
}

// Cancela la eliminación programada. 404: ya no había solicitud abierta, que para el usuario es lo mismo.
export async function cancelAccountDeletion(): Promise<void> {
  const response = await deletionRequest('/v1/me/deletion/cancel', 'POST');
  if (response.status === 401) throw new DataError('session');
  if (!response.ok && response.status !== 404) throw new DataError('unknown', 'No pudimos cancelar la eliminación. Inténtalo de nuevo.');
}
