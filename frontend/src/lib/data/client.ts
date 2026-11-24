import { getSupabase } from '../supabase';
import { DataError } from './errors';

// Cliente tipado con el esquema generado (packages/contracts/src/database.types.ts).
export const db = () => getSupabase();

// Id de la persona con sesión, leído de la sesión local (sin red). RLS lo vuelve a
// verificar en el servidor: este valor solo arma las claves de caché.
export async function requireUserId(): Promise<string> {
  const { data } = await getSupabase().auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new DataError('session');
  return id;
}
