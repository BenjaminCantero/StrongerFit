import { apiUrl } from '../../../lib/env';
import { DataError } from '../../../lib/data/errors';
import { getSupabase } from '../../../lib/supabase';
import { parseAccountDeletion, type AccountDeletion } from './account.mappers';

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
