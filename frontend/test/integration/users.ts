import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@strongerfit/contracts/database';
import { inject } from 'vitest';

const options = { auth: { persistSession: false, autoRefreshToken: false } };

// Crea una persona confirmada y devuelve un cliente con su sesión (clave pública + JWT),
// igual que la app en el teléfono.
export async function signedInUser(): Promise<{ id: string; client: SupabaseClient<Database> }> {
  const { url, anonKey, serviceKey } = inject('supabase');
  const admin = createClient(url, serviceKey, options);
  const email = `test-${randomUUID()}@strongerfit.test`;
  const password = randomUUID();
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error;
  const client = createClient<Database>(url, anonKey, options);
  const signedIn = await client.auth.signInWithPassword({ email, password });
  if (signedIn.error) throw signedIn.error;
  return { id: created.data.user.id, client };
}
